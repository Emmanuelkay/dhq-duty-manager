import sqlite3
import os

db_path = '/home/csoc_duty/dhq-duty-manager/backend/instance/personnel.db'
print(f"Connecting to database at {db_path}")

if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Dropping 'leaves' table...")
cursor.execute("DROP TABLE IF EXISTS leaves")
conn.commit()

# Verify
cursor.execute("PRAGMA table_info(leaves)")
if not cursor.fetchall():
    print("'leaves' table dropped successfully.")
else:
    print("'leaves' table still exists!")

conn.close()
print("Fix completed. Re-running the app will recreate the table correctly.")
