import pandas as pd
from sqlalchemy import create_engine
import json
import os

# --- Configuration ---
DB_NAME = 'insights.db'
DB_ENGINE = create_engine(f'sqlite:///{DB_NAME}')

# --- Helper Function for Safe JSON Parsing ---
def safe_json_loads(text, key):
    """Safely loads a JSON string and extracts a key, returning None on failure."""
    try:
        return json.loads(text).get(key)
    except (json.JSONDecodeError, TypeError, AttributeError):
        return None

# --- Processing Function for each CSV file ---

def process_youtube_comments_chunk(chunk):
    """Processes a chunk of the YouTube comments data."""
    chunk['likes'] = chunk['reactions'].apply(lambda x: safe_json_loads(x, 'likes') or 0)
    chunk.rename(columns={'id': 'source_id'}, inplace=True)
    
    columns_to_keep = [
        'source_id', 'comment_id', 'username', 'raw_text', 'text', 
        'date_of_comment', 'post_id', 'parent_comment_id', 'likes', 'text_analysis'
    ]
    
    # Ensure all desired columns exist, fill missing ones with None
    for col in columns_to_keep:
        if col not in chunk.columns:
            chunk[col] = None

    processed_chunk = chunk[columns_to_keep]
    processed_chunk['date_of_comment'] = pd.to_datetime(processed_chunk['date_of_comment'], errors='coerce')
    return processed_chunk

def process_reddit_comments_chunk(chunk):
    """Processes a chunk of the Reddit comments data."""
    chunk['likes'] = chunk['reactions'].apply(lambda x: safe_json_loads(x, 'likes') or 0)
    chunk['dislikes'] = chunk['reactions'].apply(lambda x: safe_json_loads(x, 'dislikes') or 0)
    chunk.rename(columns={'id': 'source_id'}, inplace=True)
    
    columns_to_keep = [
        'source_id', 'comment_id', 'username', 'raw_text', 'text', 
        'date_of_comment', 'post_id', 'parent_comment_id', 'likes', 'dislikes', 'text_analysis'
    ]

    for col in columns_to_keep:
        if col not in chunk.columns:
            chunk[col] = None

    processed_chunk = chunk[columns_to_keep]
    processed_chunk['date_of_comment'] = pd.to_datetime(processed_chunk['date_of_comment'], errors='coerce')
    return processed_chunk

def process_reddit_posts_chunk(chunk):
    """Processes a chunk of the Reddit posts data."""
    chunk['title'] = chunk['raw_text'].apply(lambda x: safe_json_loads(x, 'title'))
    chunk['ups'] = chunk['raw_text'].apply(lambda x: safe_json_loads(x, 'ups') or 0)
    chunk.rename(columns={'id': 'source_id', 'comments': 'num_comments'}, inplace=True)
    
    # Safely handle numeric and boolean columns
    for col in ['views', 'shares', 'reposts', 'engagement', 'num_comments', 'ups']:
        if col in chunk.columns:
            chunk[col] = pd.to_numeric(chunk[col], errors='coerce').fillna(0).astype(int)
    if 'nsfw' in chunk.columns:
        chunk['nsfw'] = chunk['nsfw'].astype(bool)

    columns_to_keep = [
        'source_id', 'post_id', 'title', 'timestamp', 'username', 'user_id', 'user_fullname',
        'ups', 'num_comments', 'link', 'platform', 'nsfw', 'media_url', 'external_url',
        'views', 'shares', 'reposts', 'engagement', 'text_analysis'
    ]

    for col in columns_to_keep:
        if col not in chunk.columns:
            chunk[col] = None
            
    processed_chunk = chunk[columns_to_keep]
    processed_chunk['timestamp'] = pd.to_datetime(processed_chunk['timestamp'], errors='coerce')
    return processed_chunk

def process_youtube_posts_chunk(chunk):
    """Processes a chunk of the YouTube posts data."""
    chunk['title'] = chunk['raw_text'].apply(lambda x: safe_json_loads(x, 'title'))
    chunk['description'] = chunk['raw_text'].apply(lambda x: safe_json_loads(x, 'description'))
    chunk.rename(columns={'id': 'source_id'}, inplace=True)
    
    # Safely handle numeric and boolean columns
    for col in ['views', 'shares', 'reposts', 'engagement', 'comments']:
        if col in chunk.columns:
            chunk[col] = pd.to_numeric(chunk[col], errors='coerce').fillna(0).astype(int)
    if 'nsfw' in chunk.columns:
        chunk['nsfw'] = chunk['nsfw'].astype(bool)
        
    columns_to_keep = [
        'source_id', 'post_id', 'title', 'description', 'timestamp', 'username', 'user_id', 
        'user_fullname', 'views', 'shares', 'reposts', 'engagement', 'comments', 
        'link', 'platform', 'nsfw', 'media_url', 'external_url', 'text_analysis'
    ]

    for col in columns_to_keep:
        if col not in chunk.columns:
            chunk[col] = None

    processed_chunk = chunk[columns_to_keep]
    processed_chunk['timestamp'] = pd.to_datetime(processed_chunk['timestamp'], errors='coerce')
    return processed_chunk


# --- Generic Loading Function ---

def load_csv_to_db(file_path, table_name, processing_function, chunk_size=10000):
    """Generic function to process any CSV and load it into the database."""
    print(f"\nProcessing '{os.path.basename(file_path)}' into table '{table_name}'...")
    
    with DB_ENGINE.connect() as connection:
        if pd.io.sql.has_table(table_name, connection):
            print(f"Table '{table_name}' already exists. Skipping.")
            return

    try:
        chunk_iterator = pd.read_csv(file_path, chunksize=chunk_size, on_bad_lines='skip', low_memory=False)
        
        is_first_chunk = True
        for i, chunk in enumerate(chunk_iterator):
            print(f"  - Processing chunk {i+1}...")
            processed_chunk = processing_function(chunk)
            
            if is_first_chunk:
                processed_chunk.to_sql(table_name, DB_ENGINE, if_exists='replace', index=False)
                is_first_chunk = False
            else:
                processed_chunk.to_sql(table_name, DB_ENGINE, if_exists='append', index=False)
                
        print(f"Successfully populated '{table_name}'")
    except FileNotFoundError:
        print(f"Error: File not found at '{file_path}'. Please check the path.")
    except Exception as e:
        print(f"An error occurred while processing {file_path}: {e}")


# --- Main Execution Block ---

if __name__ == '__main__':
    # A list defining all the files to be processed
    files_to_process = [
        { "path": "data/comments Data Dump - Youtube.csv", "table": "youtube_comments", "processor": process_youtube_comments_chunk },
        { "path": "data/comments Data Dump - Reddit.csv", "table": "reddit_comments", "processor": process_reddit_comments_chunk },
        { "path": "data/posts Data Dump - Youtube.csv", "table": "youtube_posts", "processor": process_youtube_posts_chunk },
        { "path": "data/posts Data Dump - Reddit.csv", "table": "reddit_posts", "processor": process_reddit_posts_chunk }
    ]

    print("--- Starting Data Processing ---")
    # To ensure a fresh start, we remove the old database file if it exists.
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
        print(f"Removed old database '{DB_NAME}' to rebuild.")

    for file_info in files_to_process:
        load_csv_to_db(file_info["path"], file_info["table"], file_info["processor"])
    
    print("\n--- All data processing complete. ---")
    print(f"Database '{DB_NAME}' is ready with a complete schema.")