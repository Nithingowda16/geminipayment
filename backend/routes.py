from flask import Blueprint, request, jsonify, send_from_directory, current_app, send_file
from models import db, User, Application, Document, Payment, AuditLog
from auth import token_required, role_required, generate_token
from utils import save_uploaded_file, generate_receipt_pdf, send_email_notification
from datetime import datetime, date
import os
import io
import csv
import uuid
from openpyxl import Workbook

api = Blueprint('api', __name__)

# ==========================================
# 1. AUTHENTICATION & PROFILE ENDPOINTS
# ==========================================

@api.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    remember_me = data.get('remember_me', False)
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password.'}), 401
        
    # Expiry setup
    hours = 168 if remember_me else 24
    token = generate_token(user.id, user.role, expires_in_hours=hours)
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

@api.route('/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify(current_user.to_dict()), 200

@api.route('/auth/register', methods=['POST'])
@token_required
@role_required(['admin'])
def register_user(current_user):
    """
    Admin-only endpoint to pre-approve/add users to the database.
    """
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    
    if not name or not email or not password:
        return jsonify({'message': 'Name, email, and password are required.'}), 400
        
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User with this email already exists.'}), 400
        
    new_user = User(name=name, email=email, role=role)
    new_user.set_password(password)
    
    db.session.add(new_user)
    
    # Audit log
    log = AuditLog(admin_id=current_user.id, action=f"Registered new user '{name}' ({email}) as role: {role}")
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully.',
        'user': new_user.to_dict()
    }), 201


# ==========================================
# 2. STUDENT CONTRACT APPLICATION ENDPOINTS
# ==========================================

@api.route('/applications/my', methods=['GET'])
@token_required
def get_my_application(current_user):
    # Fetch student's application
    app = Application.query.filter_by(user_id=current_user.id).first()
    if not app:
        return jsonify({'application': None}), 200
    return jsonify({'application': app.to_dict()}), 200

@api.route('/applications/submit', methods=['POST'])
@token_required
@role_required(['student'])
def submit_application(current_user):
    # Check if student already submitted an application
    existing_app = Application.query.filter_by(user_id=current_user.id).first()
    if existing_app:
        return jsonify({'message': 'You have already submitted an application.'}), 400
        
    # Check form text inputs
    full_name = request.form.get('full_name')
    email_address = request.form.get('email_address')
    phone_number = request.form.get('phone_number')
    college_name = request.form.get('college_name')
    branch = request.form.get('branch')
    year_of_study = request.form.get('year_of_study')
    registration_number = request.form.get('registration_number')
    address = request.form.get('address')
    digital_signature = request.form.get('digital_signature')
    
    # Check document file
    if 'document' not in request.files:
        return jsonify({'message': 'Contract document file is required.'}), 400
    file = request.files['document']
    
    if not all([full_name, email_address, phone_number, college_name, branch, year_of_study, registration_number, address, digital_signature]):
        return jsonify({'message': 'All form fields are required.'}), 400
        
    # Generate unique application ID: APP-YYYYMMDD-<6 random chars>
    date_str = datetime.utcnow().strftime('%Y%m%d')
    rand_suffix = uuid.uuid4().hex[:6].upper()
    app_id_str = f"APP-{date_str}-{rand_suffix}"
    
    # Save the contract document file
    upload_res = save_uploaded_file(
        file, 
        current_app.config['UPLOAD_FOLDER'], 
        current_app.config['ALLOWED_DOC_EXTENSIONS']
    )
    if not upload_res:
        return jsonify({'message': 'Invalid file upload. Only PDF, DOC, or DOCX allowed.'}), 400
    filename, file_url = upload_res
    
    # Save Application to Database
    new_app = Application(
        user_id=current_user.id,
        application_id=app_id_str,
        status='Submitted',
        full_name=full_name,
        email_address=email_address,
        phone_number=phone_number,
        college_name=college_name,
        branch=branch,
        year_of_study=year_of_study,
        registration_number=registration_number,
        address=address,
        digital_signature=digital_signature
    )
    db.session.add(new_app)
    db.session.flush() # Populate new_app.id
    
    new_doc = Document(
        application_id=new_app.id,
        file_url=file_url,
        file_name=file.filename
    )
    db.session.add(new_doc)
    db.session.commit()
    
    # Email alert (Async simulation/graceful log fallback)
    email_html = f"""
    <h3>Contract Submitted Successfully</h3>
    <p>Dear {full_name},</p>
    <p>We have successfully received your contract details. Your Application ID is <strong>{app_id_str}</strong>.</p>
    <p>Please log in to your dashboard to complete the next step (Payment Verification).</p>
    """
    send_email_notification(email_address, f"Contract Submitted: {app_id_str}", email_html)
    
    return jsonify({
        'message': 'Contract details submitted successfully.',
        'application': new_app.to_dict()
    }), 201


# ==========================================
# 3. STUDENT PAYMENT SUBMISSION
# ==========================================

@api.route('/payments/submit', methods=['POST'])
@token_required
@role_required(['student'])
def submit_payment(current_user):
    app = Application.query.filter_by(user_id=current_user.id).first()
    if not app:
        return jsonify({'message': 'Please submit your contract details first.'}), 400
        
    if app.status not in ['Submitted', 'Rejected']:
        return jsonify({'message': 'Payment details have already been submitted.'}), 400
        
    # Check fields
    amount = request.form.get('amount')
    utr_number = request.form.get('utr_number')
    payment_date_str = request.form.get('payment_date')
    
    if 'screenshot' not in request.files:
        return jsonify({'message': 'Payment proof screenshot is required.'}), 400
    screenshot_file = request.files['screenshot']
    
    if not all([amount, utr_number, payment_date_str]):
        return jsonify({'message': 'Amount, UTR number, and payment date are required.'}), 400
        
    # Parse payment date
    try:
        payment_date = datetime.strptime(payment_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD.'}), 400
        
    # Check for existing UTR (should be unique)
    existing_payment = Payment.query.filter_by(utr_number=utr_number).first()
    if existing_payment:
        return jsonify({'message': 'This Transaction ID / UTR Number has already been submitted.'}), 400
        
    # Save file screenshot
    upload_res = save_uploaded_file(
        screenshot_file, 
        current_app.config['UPLOAD_FOLDER'], 
        current_app.config['ALLOWED_IMG_EXTENSIONS']
    )
    if not upload_res:
        return jsonify({'message': 'Invalid screenshot. Only PNG, JPG, or JPEG allowed.'}), 400
    screenshot_name, screenshot_url = upload_res
    
    # Check if a payment record exists (e.g. if rejected and resubmitting)
    pay_record = Payment.query.filter_by(application_id=app.id).first()
    if pay_record:
        # Update existing
        pay_record.amount = amount
        pay_record.utr_number = utr_number
        pay_record.payment_date = payment_date
        pay_record.screenshot_url = screenshot_url
        pay_record.verification_status = 'Pending'
        pay_record.verified_at = None
        pay_record.created_at = datetime.utcnow()
    else:
        # Create new
        pay_record = Payment(
            application_id=app.id,
            amount=amount,
            utr_number=utr_number,
            payment_date=payment_date,
            screenshot_url=screenshot_url,
            verification_status='Pending'
        )
        db.session.add(pay_record)
        
    # Move Application to Payment Under Verification
    app.status = 'Payment Under Verification'
    db.session.commit()
    
    # Email alert
    email_html = f"""
    <h3>Payment Proof Uploaded</h3>
    <p>Dear {app.full_name},</p>
    <p>We have received your payment proof for Application ID <strong>{app.application_id}</strong>.</p>
    <p>Transaction ID: <strong>{utr_number}</strong></p>
    <p>Status: <strong>Payment Under Verification</strong></p>
    <p>Our administrators are reviewing your submission. You will be notified once verified.</p>
    """
    send_email_notification(app.email_address, f"Payment Received: {app.application_id}", email_html)
    
    return jsonify({
        'message': 'Payment proof submitted. Application is now under verification.',
        'application': app.to_dict()
    }), 201


# ==========================================
# 4. ADMIN DASHBOARD & REVIEW ENDPOINTS
# ==========================================

@api.route('/admin/metrics', methods=['GET'])
@token_required
@role_required(['admin'])
def get_admin_metrics(current_user):
    total_users = User.query.count()
    total_apps = Application.query.count()
    pending_apps = Application.query.filter_by(status='Payment Under Verification').count()
    approved_apps = Application.query.filter_by(status='Approved').count()
    rejected_apps = Application.query.filter_by(status='Rejected').count()
    
    return jsonify({
        'total_users': total_users,
        'total_applications': total_apps,
        'pending_reviews': pending_apps,
        'approved_applications': approved_apps,
        'rejected_applications': rejected_apps
    }), 200

@api.route('/admin/applications', methods=['GET'])
@token_required
@role_required(['admin'])
def get_all_applications(current_user):
    status_filter = request.args.get('status')
    search_query = request.args.get('search')
    
    query = Application.query
    
    # Apply filtering
    if status_filter:
        query = query.filter(Application.status == status_filter)
        
    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.filter(
            db.or_(
                Application.application_id.ilike(search_pattern),
                Application.full_name.ilike(search_pattern),
                Application.email_address.ilike(search_pattern),
                Application.registration_number.ilike(search_pattern)
            )
        )
        
    # Sort by recent first
    applications = query.order_by(Application.created_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200

@api.route('/admin/applications/<int:app_id>', methods=['GET'])
@token_required
@role_required(['admin'])
def get_application_by_id(current_user, app_id):
    app = Application.query.get(app_id)
    if not app:
        return jsonify({'message': 'Application not found.'}), 404
    return jsonify(app.to_dict()), 200

@api.route('/admin/applications/<int:app_id>/verify-payment', methods=['POST'])
@token_required
@role_required(['admin'])
def verify_payment(current_user, app_id):
    """
    Endpoint to verify payment and approve/reject the application.
    """
    app = Application.query.get(app_id)
    if not app:
        return jsonify({'message': 'Application not found.'}), 404
        
    payment = Payment.query.filter_by(application_id=app.id).first()
    if not payment:
        return jsonify({'message': 'Payment record not found for this application.'}), 404
        
    data = request.get_json() or {}
    status_input = data.get('status')  # 'Approved' or 'Rejected'
    reason = data.get('reason', '')
    
    if status_input not in ['Approved', 'Rejected']:
        return jsonify({'message': 'Status must be Approved or Rejected.'}), 400
        
    if status_input == 'Approved':
        payment.verification_status = 'Verified'
        payment.verified_at = datetime.utcnow()
        app.status = 'Approved'
        
        # Audit Log
        log = AuditLog(admin_id=current_user.id, action=f"Approved Application {app.application_id}. Payment verified.")
        db.session.add(log)
        db.session.commit() # Save first so PDF generation reads correct state
        
        # Generate receipt PDF path
        pdf_filename = f"receipt_{app.application_id}.pdf"
        pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'receipts', pdf_filename)
        generate_receipt_pdf(app, payment, pdf_path)
        
        # Send Email Notification with attachment
        email_html = f"""
        <h3>Contract & Payment Approved!</h3>
        <p>Dear {app.full_name},</p>
        <p>Your contract submission and payment have been successfully verified and approved.</p>
        <p>Application ID: <strong>{app.application_id}</strong></p>
        <p>We have attached the official Receipt & Application Summary PDF to this email.</p>
        <p>Thank you!</p>
        """
        send_email_notification(
            app.email_address, 
            f"Approved: {app.application_id}", 
            email_html, 
            attachment_path=pdf_path
        )
        
    else: # Rejected
        payment.verification_status = 'Rejected'
        app.status = 'Rejected'
        
        log = AuditLog(admin_id=current_user.id, action=f"Rejected Application {app.application_id}. Reason: {reason}")
        db.session.add(log)
        db.session.commit()
        
        # Send Email Notification
        email_html = f"""
        <h3>Payment Proof Rejected</h3>
        <p>Dear {app.full_name},</p>
        <p>Your payment verification for Application ID <strong>{app.application_id}</strong> was rejected.</p>
        <p>Reason: {reason}</p>
        <p>Please log in to your dashboard to review your submission details and re-upload the correct payment proof.</p>
        """
        send_email_notification(app.email_address, f"Action Required: Payment Rejected - {app.application_id}", email_html)
        
    return jsonify({
        'message': f'Application status updated to {app.status}.',
        'application': app.to_dict()
    }), 200

@api.route('/admin/audit-logs', methods=['GET'])
@token_required
@role_required(['admin'])
def get_audit_logs(current_user):
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200


# ==========================================
# 5. DATA EXPORT ENDPOINTS
# ==========================================

@api.route('/admin/export/csv', methods=['GET'])
@token_required
@role_required(['admin'])
def export_csv(current_user):
    """
    Exports application data to CSV format
    """
    applications = Application.query.order_by(Application.created_at.desc()).all()
    
    # Setup standard file string
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Write header
    cw.writerow([
        'Application ID', 'User Name', 'Registration Number', 'College Name', 
        'Branch', 'Year of Study', 'Status', 'UTR Number', 'Payment Amount', 'Submission Date'
    ])
    
    # Write rows
    for app in applications:
        payment = Payment.query.filter_by(application_id=app.id).first()
        utr = payment.utr_number if payment else 'N/A'
        amount = payment.amount if payment else 0.00
        cw.writerow([
            app.application_id, app.full_name, app.registration_number, app.college_name,
            app.branch, app.year_of_study, app.status, utr, amount, app.created_at.strftime('%Y-%m-%d')
        ])
        
    output = io.BytesIO()
    output.write(si.getvalue().encode('utf-8'))
    output.seek(0)
    
    # Audit log
    log = AuditLog(admin_id=current_user.id, action="Exported submissions list to CSV")
    db.session.add(log)
    db.session.commit()
    
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'submissions_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'
    )

@api.route('/admin/export/excel', methods=['GET'])
@token_required
@role_required(['admin'])
def export_excel(current_user):
    """
    Exports application data to XLSX/Excel format using openpyxl
    """
    applications = Application.query.order_by(Application.created_at.desc()).all()
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Submissions"
    
    # Column headers
    headers = [
        'Application ID', 'User Name', 'Registration Number', 'College Name', 
        'Branch', 'Year of Study', 'Status', 'UTR Number', 'Payment Amount', 'Submission Date'
    ]
    ws.append(headers)
    
    for app in applications:
        payment = Payment.query.filter_by(application_id=app.id).first()
        utr = payment.utr_number if payment else 'N/A'
        amount = float(payment.amount) if payment else 0.00
        ws.append([
            app.application_id, app.full_name, app.registration_number, app.college_name,
            app.branch, app.year_of_study, app.status, utr, amount, app.created_at.strftime('%Y-%m-%d')
        ])
        
    # Write to a memory buffer
    file_stream = io.BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)
    
    # Audit log
    log = AuditLog(admin_id=current_user.id, action="Exported submissions list to Excel")
    db.session.add(log)
    db.session.commit()
    
    return send_file(
        file_stream,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'submissions_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )


# ==========================================
# 6. SECURE FILE SERVING & PDF DOWNLOADS
# ==========================================

@api.route('/uploads/<filename>', methods=['GET'])
@token_required
def serve_uploads(current_user, filename):
    """
    Secure file retrieval. Only authenticated users can access.
    - Admins can view any file.
    - Students can only view files belonging to their own application.
    """
    # Find application/payment associated with this file path
    file_url = f"/api/uploads/{filename}"
    
    # Check if this matches a student's document or screenshot
    doc_match = Document.query.filter_by(file_url=file_url).first()
    pay_match = Payment.query.filter_by(screenshot_url=file_url).first()
    
    auth_allowed = False
    
    # Admins get immediate access
    if current_user.role == 'admin':
        auth_allowed = True
    else:
        # Determine ownership for students
        if doc_match:
            app = Application.query.get(doc_match.application_id)
            if app and app.user_id == current_user.id:
                auth_allowed = True
        elif pay_match:
            app = Application.query.get(pay_match.application_id)
            if app and app.user_id == current_user.id:
                auth_allowed = True
                
    if not auth_allowed:
        return jsonify({'message': 'Access denied. You do not own this document.'}), 403
        
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@api.route('/applications/download-pdf/<int:app_id>', methods=['GET'])
@token_required
def download_app_pdf(current_user, app_id):
    """
    Generates and downloads PDF receipt.
    - Admins can download anyone's.
    - Students can only download their own.
    """
    app = Application.query.get(app_id)
    if not app:
        return jsonify({'message': 'Application not found.'}), 404
        
    if current_user.role != 'admin' and app.user_id != current_user.id:
        return jsonify({'message': 'Access denied.'}), 403
        
    payment = Payment.query.filter_by(application_id=app.id).first()
    if not payment:
        return jsonify({'message': 'Payment record not found.'}), 400
        
    # Generate receipt PDF path
    pdf_filename = f"receipt_{app.application_id}.pdf"
    pdf_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'receipts')
    pdf_path = os.path.join(pdf_dir, pdf_filename)
    
    # Ensure generated
    generate_receipt_pdf(app, payment, pdf_path)
    
    return send_from_directory(pdf_dir, pdf_filename, as_attachment=True)
