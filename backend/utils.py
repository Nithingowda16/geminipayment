import os
from datetime import datetime
import uuid
from flask import current_app
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import logging

# Set up logging for notification issues
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def allowed_file(filename, allowed_extensions):
    """
    Check if the file has an extension matching the allowed types
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_uploaded_file(file, upload_folder, allowed_extensions):
    """
    Validate, sanitize, rename and save an uploaded file.
    Returns: (saved_filename, relative_file_url) or None if invalid
    """
    if not file or file.filename == '':
        return None
        
    if not allowed_file(file.filename, allowed_extensions):
        return None
        
    # Standardize name and generate a secure random suffix
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_id = uuid.uuid4().hex
    new_filename = f"{unique_id}.{ext}"
    
    # Ensure directory exists
    os.makedirs(upload_folder, exist_ok=True)
    
    # Save the file
    filepath = os.path.join(upload_folder, new_filename)
    file.save(filepath)
    
    # Relative path/URL for retrieval
    file_url = f"/api/uploads/{new_filename}"
    return new_filename, file_url

def generate_receipt_pdf(application, payment, dest_path):
    """
    Generate a professional PDF receipt/certificate using ReportLab
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    # Create the document layout
    doc = SimpleDocTemplate(dest_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#1A73E8'),  # Google Blue
        spaceAfter=15,
        alignment=1 # Center
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.HexColor('#5F6368'),
        spaceAfter=25,
        alignment=1
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#202124'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#3C4043'),
        leading=14
    )
    
    label_style = ParagraphStyle(
        'LabelText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#202124'),
        leading=14
    )

    status_approved_style = ParagraphStyle(
        'StatusApproved',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#137333'),  # Google Green
        alignment=1
    )
    
    # Header
    story.append(Paragraph("Google Gemini Student Ambassador Portal", title_style))
    story.append(Paragraph("Official Receipt and Application Summary", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Application Info Section
    story.append(Paragraph("Application Details", h2_style))
    app_data = [
        [Paragraph("Application ID:", label_style), Paragraph(application.application_id, body_style)],
        [Paragraph("Full Name:", label_style), Paragraph(application.full_name, body_style)],
        [Paragraph("Email Address:", label_style), Paragraph(application.email_address, body_style)],
        [Paragraph("Phone Number:", label_style), Paragraph(application.phone_number, body_style)],
        [Paragraph("College / Institution:", label_style), Paragraph(application.college_name, body_style)],
        [Paragraph("Branch & Year:", label_style), Paragraph(f"{application.branch} - Year {application.year_of_study}", body_style)],
        [Paragraph("Registration Number:", label_style), Paragraph(application.registration_number, body_style)],
        [Paragraph("Submission Date:", label_style), Paragraph(application.created_at.strftime('%Y-%m-%d %H:%M UTC'), body_style)]
    ]
    
    t_app = Table(app_data, colWidths=[150, 350])
    t_app.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F3F4'))
    ]))
    story.append(t_app)
    story.append(Spacer(1, 20))
    
    # Payment Info Section
    story.append(Paragraph("Payment & Verification Status", h2_style))
    payment_status_text = "Verified" if payment.verification_status == 'Verified' else payment.verification_status
    
    pay_data = [
        [Paragraph("UTR / Transaction ID:", label_style), Paragraph(payment.utr_number, body_style)],
        [Paragraph("Paid Amount:", label_style), Paragraph(f"INR {payment.amount:,.2f}", body_style)],
        [Paragraph("Payment Date:", label_style), Paragraph(payment.payment_date.strftime('%Y-%m-%d'), body_style)],
        [Paragraph("Verification Status:", label_style), Paragraph(payment_status_text, body_style)],
        [Paragraph("Receipt Issued On:", label_style), Paragraph(datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), body_style)]
    ]
    
    t_pay = Table(pay_data, colWidths=[150, 350])
    t_pay.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F3F4'))
    ]))
    story.append(t_pay)
    story.append(Spacer(1, 30))
    
    # Verification Badge
    badge_color = colors.HexColor('#E6F4EA') if payment.verification_status == 'Verified' else colors.HexColor('#FEF7E0')
    text_color = colors.HexColor('#137333') if payment.verification_status == 'Verified' else colors.HexColor('#B06000')
    badge_label = "APPLICATION APPROVED & VERIFIED" if payment.verification_status == 'Verified' else "PAYMENT UNDER VERIFICATION"
    
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=text_color,
        alignment=1
    )
    
    t_badge = Table([[Paragraph(badge_label, badge_style)]], colWidths=[400])
    t_badge.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), badge_color),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('BOX', (0,0), (-1,-1), 1, text_color)
    ]))
    story.append(t_badge)
    story.append(Spacer(1, 40))
    
    # Footer Notice
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#70757A'),
        alignment=1
    )
    story.append(Paragraph("This is a system-generated document and does not require a physical signature.", footer_style))
    story.append(Paragraph("Google Gemini Student Ambassador Portal. All rights reserved.", footer_style))
    
    # Build Document
    doc.build(story)

def send_email_notification(to_email, subject, body_html, attachment_path=None):
    """
    Send an email notification using SMTP configuration.
    Falls back gracefully to logging if credentials are missing or connection fails.
    """
    config = current_app.config
    
    # Check if SMTP settings are configured
    if not config['MAIL_USERNAME'] or not config['MAIL_PASSWORD']:
        logger.info(f"[Mock Email Sent] To: {to_email}\nSubject: {subject}\nBody: {body_html}\nAttachment: {attachment_path}")
        return True
        
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = config['MAIL_DEFAULT_SENDER']
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML body
        msg.attach(MIMEText(body_html, 'html'))
        
        # Handle PDF receipt attachment
        if attachment_path and os.path.exists(attachment_path):
            filename = os.path.basename(attachment_path)
            with open(attachment_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=filename)
                part['Content-Disposition'] = f'attachment; filename="{filename}"'
                msg.attach(part)
                
        # Set up server
        server = smtplib.SMTP(config['MAIL_SERVER'], config['MAIL_PORT'])
        if config['MAIL_USE_TLS']:
            server.starttls()
            
        # Log in and send
        server.login(config['MAIL_USERNAME'], config['MAIL_PASSWORD'])
        server.sendmail(config['MAIL_DEFAULT_SENDER'], to_email, msg.as_string())
        server.close()
        logger.info(f"Email successfully sent to {to_email} with subject: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        # Print fallback mockup to logs
        logger.info(f"[Fallback Log] Email notification failed but logged:\nTo: {to_email}\nSubject: {subject}\nBody: {body_html}")
        return False
