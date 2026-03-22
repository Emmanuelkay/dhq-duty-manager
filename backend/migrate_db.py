import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'personnel.db')
print(f"Checking database at {db_path}")

if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check columns in 'leaves' table
cursor.execute("PRAGMA table_info(leaves)")
columns = [column[1] for column in cursor.fetchall()]

if 'year' not in columns:
    print("Adding 'year' column to 'leaves' table...")
    cursor.execute("ALTER TABLE leaves ADD COLUMN year VARCHAR(4)")
else:
    print("'year' column already exists.")

if 'month' not in columns:
    print("Adding 'month' column to 'leaves' table...")
    cursor.execute("ALTER TABLE leaves ADD COLUMN month VARCHAR(20)")
else:
    print("'month' column already exists.")

conn.commit()
conn.close()
print("Migration completed.")
