import pandas as pd
from sqlalchemy import create_engine, text, inspect
import os
import json

# --- SQL DB Config ---
SQL_DB_NAME = 'insights.db'
SQL_ENGINE = create_engine(f'sqlite:///{SQL_DB_NAME}')

def add_column_if_not_exists(conn, table_name, column_name):
    """Add column if not present."""
    inspector = inspect(conn)
    if column_name not in [col['name'] for col in inspector.get_columns(table_name)]:
        print(f"Adding column '{column_name}' to '{table_name}'")
        conn.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} TEXT'))

def extract_nested_columns(csv_path, table_name, platform):
    """
    Correctly extracts 'body' for Reddit or 'tags' for YouTube from raw_text JSON
    and updates SQL table.
    """
    print(f"\nProcessing '{csv_path}' for '{table_name}' ({platform})...")

    # Read only id and raw_text
    df = pd.read_csv(csv_path, usecols=['id', 'raw_text'], low_memory=False)

    # Extract the correct column based on platform
    if platform == 'reddit':
        df['body'] = df['raw_text'].apply(lambda x: json.loads(x)['body'] if isinstance(x, str) and 'body' in json.loads(x) else None)
        column_to_add = 'body'
    elif platform == 'youtube':
        df['tags'] = df['raw_text'].apply(lambda x: json.dumps(json.loads(x)['tags']) if isinstance(x, str) and 'tags' in json.loads(x) else None)
        column_to_add = 'tags'

    df.rename(columns={'id': 'source_id'}, inplace=True)

    with SQL_ENGINE.connect() as conn:
        add_column_if_not_exists(conn, table_name, column_to_add)

        # Update only rows where value is currently NULL or empty
        batch_size = 500
        for start in range(0, len(df), batch_size):
            batch = df.iloc[start:start+batch_size]
            for _, row in batch.iterrows():
                value = row[column_to_add]
                if value is not None:
                    stmt = text(f"""
                        UPDATE {table_name}
                        SET {column_to_add} = :value
                        WHERE source_id = :source_id
                          AND ({column_to_add} IS NULL OR {column_to_add} = '')
                    """)
                    conn.execute(stmt, {'value': value, 'source_id': row['source_id']})

    print(f"Finished updating '{table_name}' with '{column_to_add}'.")

# --- Apply to CSV files ---
files_to_patch = [
    {"csv_path": "data/posts Data Dump - Reddit.csv", "table_name": "reddit_posts", "platform": "reddit"},
    {"csv_path": "data/posts Data Dump - Youtube.csv", "table_name": "youtube_posts", "platform": "youtube"}
]

for f in files_to_patch:
    if os.path.exists(f["csv_path"]):
        extract_nested_columns(f["csv_path"], f["table_name"], f["platform"])
    else:
        print(f"CSV not found: {f['csv_path']}")
