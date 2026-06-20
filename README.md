# Student Contract & Payment Verification Portal

A premium, production-ready private web portal where students can submit contract details, make payments, and track their verification progression, while administrators can review documents, verify transaction screenshots, and manage approvals from an interactive analytical dashboard.

Featuring a modern **Google Material Design** theme, the portal supports fluid CSS animations, dynamic forms, class-based Dark Mode, role-based JWT session controls, secure files downloads, and CSV/Excel exports.

---

## Technical Stack Overview

- **Frontend**: React.js 18, TypeScript, Tailwind CSS, Material UI (MUI v5), React Router v6, Lucide Icons.
- **Backend**: Flask (Python), JWT Sessions, PostgreSQL database, SQLAlchemy ORM, ReportLab (PDF receipts builder), OpenPyXL (Excel builder).
- **Database**: PostgreSQL (Raw schema in `backend/schema.sql`).
- **Storage**: Secure authenticated folder serving in `backend/uploads/`.

---

## Project Structure

```
pay/
├── backend/
│   ├── app.py             # Main Flask server entrypoint
│   ├── config.py          # General configuration settings
│   ├── models.py          # SQLAlchemy PostgreSQL database models
│   ├── auth.py            # JWT Authorization & RBAC decorators
│   ├── routes.py          # REST API controller blueprints
│   ├── utils.py           # ReportLab PDF & SMTP mailer services
│   ├── seed.py            # Database tables setup & seeding script
│   ├── schema.sql         # Raw database definition tables
│   ├── requirements.txt   # Python server requirements
│   └── test_api.py        # Isolated unittest file using in-memory db
│
├── frontend/
│   ├── public/
│   │   └── qr_code.jpg    # Payment scan QR image (Amount: ₹3,199.00)
│   ├── src/
│   │   ├── components/    # Reusable Timeline stepper, Navbar, Sidebar
│   │   ├── context/       # AuthContext user sessions & Dark Mode
│   │   ├── pages/         # Login, Dashboard, Forms, Admin review, logs
│   │   ├── theme.ts       # Material UI light & dark Google tokens
│   │   ├── App.tsx        # Main application router
│   │   ├── index.css      # Custom glassmorphism, fonts, scroll bars
│   │   └── main.tsx       # Vite mounting entrypoint
│   ├── package.json       # React dependencies configuration
│   ├── vite.config.ts     # Vite compilation & backend API proxy mapping
│   ├── tailwind.config.js # Custom color extensions for tailwind
│   └── postcss.config.js  # Styling compiler
│
├── copy_qr.py             # Helper to copy QR code image
└── README.md              # Installation and run instructions
```

---

## Installation & Setup Instructions

Follow these step-by-step procedures to set up the system on your local Windows machine.

### STEP 1: Copy the Payment QR Code Image
First, copy the uploaded QR code image to the public folder using the prepared Python helper script:
```bash
python copy_qr.py
```
This copies the image to `frontend/public/qr_code.jpg` for render.

### STEP 2: Configure Database Connection (Zero Configuration SQLite)
By default, the application is set up with **SQLite** to run immediately out-of-the-box with zero configurations:
- It automatically creates a local database file `backend/database.db` on your first startup.
- **Optional (PostgreSQL)**: If you prefer using PostgreSQL, set a system environment variable named `DATABASE_URL` (e.g. `postgresql://postgres:postgres@localhost:5432/pay_portal`) or modify the connection string in [config.py](file:///c:/Users/nithi/OneDrive/Desktop/pay/backend/config.py) directly. You will then need to create a database named `pay_portal` in PostgreSQL.

### STEP 3: Setup Backend Environment & Seeding
1. Open a terminal at the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the seeding script to create database tables and insert initial test users:
   ```bash
   python seed.py
   ```
5. Start the Flask application:
   ```bash
   python app.py
   ```
The backend server runs locally at: `http://127.0.0.1:5000`.

### STEP 4: Setup Frontend Environment & Development Server
1. Open a new terminal at the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm node modules:
   ```bash
   npm install
   ```
3. Start the Vite development hot-reload server:
   ```bash
   npm run dev
   ```
The React frontend server is available at: `http://localhost:5173`.

---

## Running the Automated Test Suite

We created a self-contained unit-test suite to verify the security parameters and endpoints. It overrides PostgreSQL to run in-process using an in-memory SQLite database, isolating the test execution completely.

To run tests:
1. Make sure your python virtual environment is activated in `backend/`.
2. Execute the test file:
   ```bash
   python test_api.py
   ```
You should see a series of confirmation outputs (`ok` responses) for API authentication, student submission workflows, admin metrics, and export parameters.

---

## Default Login Credentials

Use the following pre-seeded credentials to explore the portal features:

### Student Credentials
- **Email**: `student@example.com`
- **Password**: `password123`
*Allows completing contract forms, scanning payment QR code, uploading receipt proof, and downloading official receipt PDFs.*

### Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `adminpassword`
*Allows reviewing submissions, viewing document attachments, checking analytical metric cards, verifying payments (approve/reject), viewing secure audit logs, and downloading CSV/Excel report spreadsheets.*

---

## Security & Architecture Highlights

1. **Role-Based Routing Controls**: Enforces backend protection using `@token_required` and `@role_required(['admin'])` decorators in `auth.py` and route-guards (`ProtectedRoute.tsx`) on the React routing layers.
2. **Authenticated File Serving**: Uploaded student contracts and screenshots are stored outside public static directories. The endpoint `/api/uploads/<filename>` requires valid tokens and permits access *only* to admins or the student owner.
3. **Session Persistence**: React context (`AuthContext.tsx`) persists logged-in states, remember-me settings, and user settings (dark mode layout) across page reloads.
4. **Resilient Notifications**: Email updates (SMTP settings) are wrapped in fallback catch-blocks that output notification details to backend logs in case SMTP server configurations are not loaded.
