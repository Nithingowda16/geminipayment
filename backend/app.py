from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db
from routes import api
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure CORS - Enable requests from frontend origin (default Vite port: 5173)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
    
    # Initialize DB
    db.init_app(app)
    
    # Create upload directories if they don't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'receipts'), exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    # Auto-create tables and seed data on startup (supporting Render Free tier)
    with app.app_context():
        try:
            db.create_all()
            from models import User
            # Seed default student
            if not User.query.filter_by(email="student@example.com").first():
                student = User(
                    name="John Student",
                    email="student@example.com",
                    role="student"
                )
                student.set_password("password123")
                db.session.add(student)
            
            # Seed default admin
            if not User.query.filter_by(email="admin@example.com").first():
                admin = User(
                    name="Admin Manager",
                    email="admin@example.com",
                    role="admin"
                )
                admin.set_password("adminpassword")
                db.session.add(admin)
                
            # Seed Sai Shivani student account
            if not User.query.filter_by(email="saishivani@geminiambassador.com").first():
                shivani = User(
                    name="Sai Shivani",
                    email="saishivani@geminiambassador.com",
                    role="student"
                )
                shivani.set_password("saishivani@password")
                db.session.add(shivani)
                
            db.session.commit()
            print("Database checked and pre-seeded successfully on startup.")
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding database on startup: {str(e)}")
    
    # Base endpoint
    @app.route('/')
    def index():
        return jsonify({
            'status': 'success',
            'message': 'Google Gemini Student Ambassador Portal API is running.'
        })
        
    # File size limits handler
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            'message': 'File uploaded is too large. Max file size limit is 16MB.'
        }), 413
        
    return app

if __name__ == '__main__':
    app = create_app()
    # Bind to all interfaces for flexibility in development environments
    app.run(host='127.0.0.1', port=5000, debug=True)
