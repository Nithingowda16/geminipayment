import unittest
import json
import io
import os
from datetime import date
from app import create_app
from models import db, User, Application, Payment, Document, AuditLog
from config import Config

class TestPortalAPI(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        self.app = create_app()
        self.app.config['TESTING'] = True
        
        # Use an isolated, in-memory SQLite database for test execution
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['UPLOAD_FOLDER'] = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'test_uploads')
        
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Create seed accounts
            self.seed_users()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            
        # Clean up test uploads directory if it exists
        if os.path.exists(self.app.config['UPLOAD_FOLDER']):
            import shutil
            shutil.rmtree(self.app.config['UPLOAD_FOLDER'], ignore_errors=True)

    def seed_users(self):
        # 1. Test Student
        self.student = User(name="Test Student", email="student@test.com", role="student")
        self.student.set_password("studentpass")
        db.session.add(self.student)
        
        # 2. Test Admin
        self.admin = User(name="Test Admin", email="admin@test.com", role="admin")
        self.admin.set_password("adminpass")
        db.session.add(self.admin)
        
        db.session.commit()

    def get_token(self, email, password):
        res = self.client.post('/api/auth/login', 
                               data=json.dumps({'email': email, 'password': password}),
                               content_type='application/json')
        data = json.loads(res.data)
        return data['token']

    def test_login_success(self):
        res = self.client.post('/api/auth/login', 
                               data=json.dumps({'email': 'student@test.com', 'password': 'studentpass'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'student')

    def test_login_invalid(self):
        res = self.client.post('/api/auth/login', 
                               data=json.dumps({'email': 'student@test.com', 'password': 'wrongpassword'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_student_flow(self):
        # Get Student token
        student_token = self.get_token('student@test.com', 'studentpass')
        headers = {'Authorization': f'Bearer {student_token}'}

        # 1. Verify initially no application exists
        res = self.client.get('/api/applications/my', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIsNone(data['application'])

        # 2. Submit contract form
        form_data = {
            'full_name': 'Test Student',
            'email_address': 'student@test.com',
            'phone_number': '1234567890',
            'college_name': 'MIT College',
            'branch': 'Computer Science',
            'year_of_study': '3rd',
            'registration_number': 'REG-99120',
            'address': '123 Tech Lane, Boston',
            'digital_signature': 'Test Student Signature',
            'document': (io.BytesIO(b"dummy contract pdf content"), 'contract.pdf')
        }
        res = self.client.post('/api/applications/submit', 
                               headers=headers,
                               data=form_data,
                               content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data['application']['status'], 'Submitted')
        app_id = data['application']['id']

        # 3. Verify application now exists on retrieve
        res = self.client.get('/api/applications/my', headers=headers)
        data = json.loads(res.data)
        self.assertIsNotNone(data['application'])
        self.assertEqual(data['application']['full_name'], 'Test Student')

        # 4. Submit Payment
        payment_data = {
            'amount': '3199.00',
            'utr_number': 'UTR123456789',
            'payment_date': '2026-06-20',
            'screenshot': (io.BytesIO(b"dummy payment screenshot content"), 'screenshot.png')
        }
        res = self.client.post('/api/payments/submit',
                               headers=headers,
                               data=payment_data,
                               content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)
        
        # Verify status changed to under verification
        res = self.client.get('/api/applications/my', headers=headers)
        data = json.loads(res.data)
        self.assertEqual(data['application']['status'], 'Payment Under Verification')

    def test_admin_flow_and_verification(self):
        # 1. Establish an application in the system first
        student_token = self.get_token('student@test.com', 'studentpass')
        headers_student = {'Authorization': f'Bearer {student_token}'}
        
        form_data = {
            'full_name': 'Test Student',
            'email_address': 'student@test.com',
            'phone_number': '1234567890',
            'college_name': 'MIT College',
            'branch': 'Computer Science',
            'year_of_study': '3rd',
            'registration_number': 'REG-99120',
            'address': '123 Tech Lane, Boston',
            'digital_signature': 'Test Student Signature',
            'document': (io.BytesIO(b"dummy contract pdf content"), 'contract.pdf')
        }
        self.client.post('/api/applications/submit', headers=headers_student, data=form_data, content_type='multipart/form-data')
        
        # Submit payment
        payment_data = {
            'amount': '3199.00',
            'utr_number': 'UTR9988776655',
            'payment_date': '2026-06-20',
            'screenshot': (io.BytesIO(b"dummy screenshot"), 'proof.jpg')
        }
        self.client.post('/api/payments/submit', headers=headers_student, data=payment_data, content_type='multipart/form-data')

        # 2. Log in as admin
        admin_token = self.get_token('admin@test.com', 'adminpass')
        headers_admin = {'Authorization': f'Bearer {admin_token}'}

        # 3. Check metrics
        res = self.client.get('/api/admin/metrics', headers=headers_admin)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['pending_reviews'], 1)

        # 4. Check list submissions
        res = self.client.get('/api/admin/applications', headers=headers_admin)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(len(data), 1)
        app_db_id = data[0]['id']

        # 5. Approve application
        res = self.client.post(f'/api/admin/applications/{app_db_id}/verify-payment',
                               headers=headers_admin,
                               data=json.dumps({'status': 'Approved'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        
        # Verify status is now Approved
        res = self.client.get('/api/admin/applications', headers=headers_admin)
        data = json.loads(res.data)
        self.assertEqual(data[0]['status'], 'Approved')
        
        # 6. Verify audit logs record exists
        res = self.client.get('/api/admin/audit-logs', headers=headers_admin)
        data = json.loads(res.data)
        self.assertTrue(len(data) > 0)
        self.assertIn("Approved Application", data[0]['action'])

        # 7. Check export functions
        res = self.client.get('/api/admin/export/csv', headers=headers_admin)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'text/csv')

if __name__ == '__main__':
    unittest.main()
