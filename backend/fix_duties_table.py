import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'personnel.db')
print(f"Migrating database at {db_path}")

if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # 1. Create a temporary table with the new schema
    print("Creating temporary table...")
    cursor.execute("""
        CREATE TABLE duties_new (
            id INTEGER PRIMARY KEY,
            date DATE NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    # 2. Copy data from old table to new table
    print("Copying data...")
    cursor.execute("INSERT INTO duties_new (id, date, user_id) SELECT id, date, user_id FROM duties")

    # 3. Drop the old table
    print("Dropping old table...")
    cursor.execute("DROP TABLE duties")

    # 4. Rename new table to original name
    print("Renaming table...")
    cursor.execute("ALTER TABLE duties_new RENAME TO duties")

    # 5. Add the composite unique constraint (via index in SQLite)
    print("Adding composite unique index...")
    cursor.execute("CREATE UNIQUE INDEX uq_duty_date_user ON duties (date, user_id)")

    conn.commit()
    print("Migration successful: Multiple personnel can now be assigned per day.")
except Exception as e:
    conn.rollback()
    print(f"Migration failed: {e}")
finally:
    conn.close()
