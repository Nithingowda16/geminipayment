import os
import shutil

src = r"C:\Users\nithi\.gemini\antigravity-ide\brain\11756892-dea8-406d-b484-8b3484cc2660\media__1781953417568.jpg"
dest_dir = r"c:\Users\nithi\OneDrive\Desktop\pay\frontend\public"
dest = os.path.join(dest_dir, "qr_code.jpg")

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir, exist_ok=True)

if os.path.exists(src):
    shutil.copy(src, dest)
    print(f"Success: Copied QR code to {dest}")
else:
    print(f"Error: Source file not found at {src}")
