import os
from dotenv import load_dotenv

# Load env variables from a .env file if available
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    # General API Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'google-inspired-portal-dev-secret-key-189312')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'google-inspired-portal-jwt-secret-key-492931')
    
    # Database Configuration (SQLite Default, overrides if DATABASE_URL env is set)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secure File Uploads Configuration
    # We save in the local backend/uploads directory
    UPLOAD_FOLDER = os.environ.get(
        'UPLOAD_FOLDER',
        os.path.join(BASE_DIR, 'uploads')
    )
    
    # 16 MB max limit on uploads
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    # File type restrictions
    ALLOWED_DOC_EXTENSIONS = {'pdf', 'docx', 'doc'}
    ALLOWED_IMG_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    
    # CORS origin setup
    CORS_HEADERS = 'Content-Type'
    
    # Mail Config (SMTP Settings - placeholders or customizable env)
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'no-reply@contractportal.com')
