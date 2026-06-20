import jwt
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from functools import wraps
from models import User

def generate_token(user_id, role, expires_in_hours=24):
    """
    Generate a JWT token for the authenticated user
    """
    payload = {
        'sub': user_id,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    
    # Encode token using config-defined JWT key
    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    return token

def token_required(f):
    """
    Decorator to protect routes and ensure a valid JWT token is provided in the headers
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Look for the Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Expecting format "Bearer <token>"
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format. Use: Bearer <token>'}), 401
                
        # Fallback to query parameter (needed for browser direct downloads)
        if not token and 'token' in request.args:
            token = request.args.get('token')
            
        if not token:
            return jsonify({'message': 'Authentication token is missing!'}), 401
            
        try:
            # Decode payload
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Fetch current user from database
            current_user = User.query.get(payload['sub'])
            if not current_user:
                return jsonify({'message': 'User associated with token not found!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Session expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid authentication token.'}), 401
            
        # Return route function with user info injected
        return f(current_user, *args, **kwargs)
        
    return decorated

def role_required(allowed_roles):
    """
    Decorator to enforce Role-Based Access Control (RBAC).
    Must be used AFTER @token_required.
    """
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                return jsonify({
                    'message': 'Access forbidden. Insufficient permissions.'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator
