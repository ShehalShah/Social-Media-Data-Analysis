import pandas as pd
from sqlalchemy import create_engine
import json
import os
import pinecone
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

# --- Configuration & Initialization ---
load_dotenv() # Load variables from .env file

# SQL Database Config
SQL_DB_NAME = 'insights.db'
SQL_ENGINE = create_engine(f'sqlite:///{SQL_DB_NAME}')

# Pinecone Config
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
PINECONE_INDEX_NAME = 'insights-index'

# Sentence Transformer Model
print("Loading Sentence Transformer model... (This may take a moment)")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
print("Model loaded.")

# Initialize Pinecone
# pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
pc = Pinecone(api_key=PINECONE_API_KEY)


def count_csv_rows(file_path):
    """Efficiently counts the number of rows in a CSV file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        # Subtract 1 for the header row
        return sum(1 for line in f) - 1

# --- Helper Function for Advanced JSON Parsing ---
def parse_analysis_data(series):
    """Parses the 'text_analysis' JSON column into separate columns."""
    data = {'sentiment_neutral': [], 'sentiment_negative': [], 'sentiment_positive': [], 'toxicity': []}
    
    for item in series:
        try:
            analysis = json.loads(item)
            # Sentiment
            sentiment = analysis.get('Sentiment', {})
            data['sentiment_neutral'].append(sentiment.get('neutral'))
            data['sentiment_negative'].append(sentiment.get('negative'))
            data['sentiment_positive'].append(sentiment.get('positive'))
            # Toxicity - get the key that is NOT 'non_toxic'
            toxicity_dict = analysis.get('Toxicity', {})
            toxic_key = next((k for k in toxicity_dict if k != 'non_toxic'), 'non_toxic')
            data['toxicity'].append(toxic_key if toxicity_dict.get(toxic_key, 0) > 0.5 else 'non_toxic')

        except (json.JSONDecodeError, TypeError, AttributeError):
            for key in data: data[key].append(None)
            
    return pd.DataFrame(data, index=series.index)


# --- DETAILED Processing Functions for Each CSV file ---

def process_comments_chunk(chunk, platform):
    """Unified processor for both YouTube and Reddit comments."""
    # Reactions
    if platform == 'youtube':
        chunk['likes'] = chunk['reactions'].apply(lambda x: json.loads(x).get('likes') if isinstance(x, str) else 0)
    else:
        chunk['likes'] = chunk['reactions'].apply(lambda x: json.loads(x).get('likes') if isinstance(x, str) else 0)
        chunk['dislikes'] = chunk['reactions'].apply(lambda x: json.loads(x).get('dislikes') if isinstance(x, str) else 0)

    # Text Analysis
    analysis_df = parse_analysis_data(chunk['text_analysis'])
    chunk = pd.concat([chunk, analysis_df], axis=1)

    chunk.rename(columns={'id': 'source_id'}, inplace=True)
    
    base_columns = ['source_id', 'comment_id', 'username', 'raw_text', 'text', 'date_of_comment', 'post_id', 'parent_comment_id', 'likes',
                    'sentiment_neutral', 'sentiment_negative', 'sentiment_positive', 'toxicity']
    if platform == 'reddit':
        base_columns.append('dislikes')

    for col in base_columns:
        if col not in chunk.columns: chunk[col] = None
    
    processed_chunk = chunk[base_columns]
    processed_chunk['date_of_comment'] = pd.to_datetime(processed_chunk['date_of_comment'], errors='coerce')
    return processed_chunk

def process_posts_chunk(chunk, platform):
    """Unified processor for both YouTube and Reddit posts."""
    # Text/Title/Description from raw_text JSON
    chunk['title'] = chunk['raw_text'].apply(lambda x: json.loads(x).get('title') if isinstance(x, str) else None)
    if platform == 'youtube':
        chunk['description'] = chunk['raw_text'].apply(lambda x: json.loads(x).get('description') if isinstance(x, str) else None)

    # Engagement Metrics
    numeric_cols = ['comments', 'views', 'shares', 'reposts', 'engagement']
    if platform == 'reddit':
        numeric_cols.append('ups')
        chunk['ups'] = chunk['raw_text'].apply(lambda x: json.loads(x).get('ups') if isinstance(x, str) else 0)

    for col in numeric_cols:
        if col in chunk.columns:
            chunk[col] = pd.to_numeric(chunk[col], errors='coerce').fillna(0).astype(int)

    # Text Analysis
    analysis_df = parse_analysis_data(chunk['text_analysis'])
    chunk = pd.concat([chunk, analysis_df], axis=1)
    
    chunk.rename(columns={'id': 'source_id'}, inplace=True)

    base_columns = ['source_id', 'post_id', 'title', 'timestamp', 'username', 'user_id', 'user_fullname', 'comments', 'link', 'platform', 'nsfw', 'media_url', 'external_url',
                    'views', 'shares', 'reposts', 'engagement', 'sentiment_neutral', 'sentiment_negative', 'sentiment_positive', 'toxicity']
    
    if platform == 'youtube':
        base_columns.append('description')
    else: # reddit
        base_columns.append('ups')

    for col in base_columns:
        if col not in chunk.columns: chunk[col] = None

    processed_chunk = chunk[base_columns]
    processed_chunk['timestamp'] = pd.to_datetime(processed_chunk['timestamp'], errors='coerce')
    return processed_chunk


# --- Main Data Loading & Embedding Function ---
def process_and_load_data(file_info, csv_chunk_size=2000, pinecone_batch_size=100):
    file_path, table_name, processor, text_column, platform = file_info.values()

    # NEW: Check if the table already exists in the SQL DB. If so, skip the file.
    with SQL_ENGINE.connect() as connection:
        if pd.io.sql.has_table(table_name, connection):
            print(f"\nTable '{table_name}' already exists in the database. Skipping file.")
            return

    total_rows = count_csv_rows(file_path)
    total_chunks = (total_rows // csv_chunk_size) + 1
    print(f"\nProcessing '{os.path.basename(file_path)}' ({total_rows} rows in {total_chunks} chunks)...")
    
    index = pc.Index(PINECONE_INDEX_NAME)
    
    chunk_iterator = pd.read_csv(file_path, chunksize=csv_chunk_size, on_bad_lines='skip', low_memory=False)
    is_first_sql_chunk = True

    for i, chunk in enumerate(chunk_iterator):
        # print(f"  - Processing CSV chunk {i+1} for {table_name}...")
        print(f"  - Processing CSV chunk {i+1} of {total_chunks} for {table_name}...")
        
        # 1. Process for SQL
        # FIX: Process the chunk first to create derived columns like 'title'
        processed_chunk = processor(chunk.copy(), platform)
        
        # 1. Process for SQL
        if is_first_sql_chunk:
            processed_chunk.to_sql(table_name, SQL_ENGINE, if_exists='replace', index=False)
            is_first_sql_chunk = False
        else:
            processed_chunk.to_sql(table_name, SQL_ENGINE, if_exists='append', index=False)

        # 2. Process for Pinecone Embeddings using the already processed chunk
        # Now the 'title' column exists when this code is reached.
        pinecone_chunk = processed_chunk.dropna(subset=[text_column, 'source_id']).copy()
        pinecone_chunk = pinecone_chunk[pinecone_chunk[text_column].astype(str).str.strip() != '']
        if pinecone_chunk.empty: continue

        texts_to_embed = pinecone_chunk[text_column].tolist()
        ids = [f"{table_name}_{int(row_id)}" for row_id in pinecone_chunk['source_id']]
        embeddings = embedding_model.encode(texts_to_embed).tolist()
        metadata = [{"source": table_name, "text": text} for text in texts_to_embed]

        # 3. Upsert to Pinecone in smaller batches to avoid size limits
        for j in range(0, len(ids), pinecone_batch_size):
            batch_end = j + pinecone_batch_size
            batch_ids = ids[j:batch_end]
            batch_embeddings = embeddings[j:batch_end]
            batch_metadata = metadata[j:batch_end]
            
            # Zip the batch data for upsert
            batch_to_upsert = zip(batch_ids, batch_embeddings, batch_metadata)
            index.upsert(vectors=list(batch_to_upsert))

    print(f"Successfully processed and uploaded '{os.path.basename(file_path)}'")

# --- Main Execution Block ---
if __name__ == '__main__':
    if not all([PINECONE_API_KEY, PINECONE_ENVIRONMENT]):
        print("Error: Pinecone API Key or Environment not found in .env file.")
        exit()

    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        print(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
        # NEW: Updated index creation with required `spec`
        pc.create_index(
            name=PINECONE_INDEX_NAME, 
            dimension=384, 
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1') # Free tier is on AWS
        )
        print("Index created.")
    else:
        print(f"Pinecone index '{PINECONE_INDEX_NAME}' already exists. Clearing old data...")
        # index = pc.Index(PINECONE_INDEX_NAME)
        # try:
        #     index.delete(delete_all=True)
        #     print("Index cleared.")
        # except pinecone.exceptions.NotFoundException:
        #     print("No namespace found to clear, skipping.")


    # if os.path.exists(SQL_DB_NAME):
    #     os.remove(SQL_DB_NAME)
    #     print(f"Removed old SQL database '{SQL_DB_NAME}' to rebuild.")
    
    files_to_process = [
        {"path": "data/comments Data Dump - Youtube.csv", "table": "youtube_comments", "processor": process_comments_chunk, "text_col": "text", "platform": "youtube"},
        {"path": "data/comments Data Dump - Reddit.csv", "table": "reddit_comments", "processor": process_comments_chunk, "text_col": "text", "platform": "reddit"},
        {"path": "data/posts Data Dump - Youtube.csv", "table": "youtube_posts", "processor": process_posts_chunk, "text_col": "title", "platform": "youtube"},
        {"path": "data/posts Data Dump - Reddit.csv", "table": "reddit_posts", "processor": process_posts_chunk, "text_col": "title", "platform": "reddit"}
    ]

    print("\n--- Starting Data Processing and Embedding ---")
    for f_info in files_to_process:
        if os.path.exists(f_info["path"]):
            process_and_load_data(f_info)
        else:
            print(f"\nWarning: File not found at '{f_info['path']}'. Skipping.")
    
    print("\n--- All data processing and embedding complete. ---")