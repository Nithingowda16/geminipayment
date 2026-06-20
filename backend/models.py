from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # 'student', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    applications = db.relationship('Application', backref='user', cascade='all, delete-orphan', lazy=True)

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    application_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    status = db.Column(db.String(50), default='Submitted', nullable=False)  # 'Submitted', 'Payment Under Verification', 'Approved', 'Rejected'
    
    # Contract Form Details
    full_name = db.Column(db.String(255), nullable=False)
    email_address = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(50), nullable=False)
    college_name = db.Column(db.String(255), nullable=False)
    branch = db.Column(db.String(100), nullable=False)
    year_of_study = db.Column(db.String(50), nullable=False)
    registration_number = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=False)
    digital_signature = db.Column(db.Text, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    documents = db.relationship('Document', backref='application', cascade='all, delete-orphan', lazy=True)
    payments = db.relationship('Payment', backref='application', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'application_id': self.application_id,
            'status': self.status,
            'full_name': self.full_name,
            'email_address': self.email_address,
            'phone_number': self.phone_number,
            'college_name': self.college_name,
            'branch': self.branch,
            'year_of_study': self.year_of_study,
            'registration_number': self.registration_number,
            'address': self.address,
            'digital_signature': self.digital_signature,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'documents': [doc.to_dict() for doc in self.documents],
            'payments': [p.to_dict() for p in self.payments]
        }


class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    utr_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    payment_date = db.Column(db.Date, nullable=False)
    screenshot_url = db.Column(db.String(500), nullable=False)
    verification_status = db.Column(db.String(50), default='Pending', nullable=False)  # 'Pending', 'Verified', 'Rejected'
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'amount': float(self.amount),
            'utr_number': self.utr_number,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'screenshot_url': self.screenshot_url,
            'verification_status': self.verification_status,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to user/admin
    admin = db.relationship('User', foreign_keys=[admin_id])

    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_name': self.admin.name if self.admin else 'System/Deleted User',
            'action': self.action,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
