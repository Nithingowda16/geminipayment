import os
import sqlite3

db_path = r"c:\Users\nithi\OneDrive\Desktop\pay\backend\database.db"

if not os.path.exists(db_path):
    print("Database file not found!")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get users
cursor.execute("SELECT id, name, email, role FROM users")
print("--- USERS ---")
for row in cursor.fetchall():
    print(row)

# Get applications
cursor.execute("SELECT id, user_id, application_id, status, full_name FROM applications")
print("\n--- APPLICATIONS ---")
for row in cursor.fetchall():
    print(row)

# Get payments
cursor.execute("SELECT id, application_id, amount, utr_number, verification_status FROM payments")
print("\n--- PAYMENTS ---")
for row in cursor.fetchall():
    print(row)

conn.close()
