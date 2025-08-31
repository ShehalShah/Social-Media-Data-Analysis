import sqlite3
import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# --- Config ---
SQLITE_DB_PATH = "insights.db"  # Your local SQLite DB
POSTGRES_URI = os.getenv("DATABASE_URL")

# --- Connect to SQLite ---
sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
sqlite_cursor = sqlite_conn.cursor()

# --- Connect to Postgres (Neon) ---
pg_engine = create_engine(POSTGRES_URI)

# --- Get list of tables in SQLite ---
sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in sqlite_cursor.fetchall()]

print(f"Found tables: {tables}")

for table in tables:
    print(f"Migrating table: {table}")
    
    # Read entire table from SQLite
    df = pd.read_sql(f"SELECT * FROM {table}", sqlite_conn)
    
    # Optional: convert SQLite types to Postgres-compatible types if needed
    # For example, booleans, timestamps, etc.
    
    # Write to Postgres
    df.to_sql(table, pg_engine, if_exists="replace", index=False)
    print(f"Table {table} migrated successfully.")

print("Migration complete!")

# Close connections
sqlite_conn.close()
pg_engine.dispose()
