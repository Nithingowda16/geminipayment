import os
import sys
from flask import Flask

# Add parent directory to path so config/models can be imported if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from models import db, User

def add_user(email, password, name, role):
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User {email} already exists! Updating password and role...")
            user.set_password(password)
            user.role = role
            user.name = name
        else:
            print(f"Creating user {email} with role {role}...")
            user = User(
                name=name,
                email=email,
                role=role
            )
            user.set_password(password)
            db.session.add(user)
        
        try:
            db.session.commit()
            print(f"Successfully configured user: {email} ({role})")
        except Exception as e:
            db.session.rollback()
            print(f"Error saving to database: {str(e)}")

if __name__ == '__main__':
    # Parse args if provided, otherwise use defaults
    email = sys.argv[1] if len(sys.argv) > 1 else "saishivani@geminiambassador.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "saishivani@password"
    name = sys.argv[3] if len(sys.argv) > 3 else "Sai Shivani"
    role = sys.argv[4] if len(sys.argv) > 4 else "admin"
    
    add_user(email, password, name, role)
