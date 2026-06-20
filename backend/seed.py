import os
import sys
from flask import Flask
from config import Config
from models import db, User

def seed_database():
    """
    Seed initial user accounts into the database
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize SQLAlchemy database instance
    db.init_app(app)
    
    with app.app_context():
        print("Recreating database tables...")
        try:
            # Recreate tables (drop and create)
            db.drop_all()
            db.create_all()
            print("Database tables created successfully.")
        except Exception as e:
            print(f"Error creating database tables: {str(e)}")
            print("Please ensure your PostgreSQL server is running and the credentials in Config.SQLALCHEMY_DATABASE_URI are correct.")
            sys.exit(1)
            
        print("Seeding users...")
        
        # Check if users already exist
        if User.query.filter_by(email="student@example.com").first():
            print("Default student account already exists. Skipping seed.")
            return
            
        # 1. Create Default Student
        student = User(
            name="John Student",
            email="student@example.com",
            role="student"
        )
        student.set_password("password123")
        db.session.add(student)
        print("Created student account: student@example.com / password123")
        
        # 2. Create Default Admin
        admin = User(
            name="Admin Manager",
            email="admin@example.com",
            role="admin"
        )
        admin.set_password("adminpassword")
        db.session.add(admin)
        print("Created admin account: admin@example.com / adminpassword")
        
        try:
            db.session.commit()
            print("Database seeded successfully with test credentials!")
        except Exception as e:
            db.session.rollback()
            print(f"Commit error: {str(e)}")

if __name__ == '__main__':
    seed_database()
