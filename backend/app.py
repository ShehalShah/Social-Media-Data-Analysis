from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
import pandas as pd
from pydantic import BaseModel
from typing import List, Optional, Any, Dict, Union
import os
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
# import google.generativeai as genai
import re
import json
import asyncio
from datetime import datetime, timedelta
from collections import defaultdict
import sqlite3
import traceback
# from agent import agent_executor

# Import the specialist agents and tools from our new agent.py file
# from agent import router_chain, sql_agent_executor, semantic_search_tool, chart_selector_chain
# from agent import agent_executor
from agent import create_agent

load_dotenv()
# SQL_DB_NAME = 'insights.db'
# SQL_ENGINE = create_engine(f'sqlite:///{SQL_DB_NAME}')
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file.")
SQL_ENGINE = create_engine(DATABASE_URL)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = 'insights-index'
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
pc = Pinecone(api_key=PINECONE_API_KEY)
pinecone_index = pc.Index(PINECONE_INDEX_NAME)
# genai.configure(api_key=GEMINI_API_KEY)
# llm = genai.GenerativeModel('gemini-1.5-flash')

DB_SCHEMA = """
Table: youtube_comments (contains comments from YouTube)
Columns: source_id, comment_id, username, text, date_of_comment, post_id, likes, sentiment_positive, toxicity

Table: reddit_comments (contains comments from Reddit)
Columns: source_id, comment_id, username, text, date_of_comment, post_id, likes, dislikes, sentiment_positive, toxicity

Table: youtube_posts (contains posts/videos from YouTube)
Columns: source_id, post_id, title, timestamp, username, views, shares, comments, link, platform, sentiment_positive, toxicity

Table: reddit_posts (contains posts from Reddit)
Columns: source_id, post_id, title, timestamp, username, ups, num_comments, link, platform, sentiment_positive, toxicity
"""

class TopRedditPost(BaseModel):
    title: Optional[str] = "No Title"
    ups: int

class TopYoutubePost(BaseModel):
    title: Optional[str] = "No Title"
    views: int

class OverallSummary(BaseModel):
    total_youtube_comments: int
    total_reddit_comments: int
    total_youtube_posts: int
    total_reddit_posts: int
    top_reddit_posts: List[TopRedditPost]
    top_youtube_posts: List[TopYoutubePost]

class ChatQuery(BaseModel):
    query: str

class TextResponse(BaseModel):
    type: str = "text"
    content: str

class ChartResponse(BaseModel):
    type: str = "chart"
    content: Dict[str, Any]
    summary: str

class AnalyticsResponse(BaseModel):
    total_posts: int
    total_comments: int
    platforms: Dict[str, Any]
    engagement_stats: Dict[str, Any]
    sentiment_overview: Dict[str, Any]
    top_keywords: List[Dict[str, Any]]

class TrendData(BaseModel):
    date: str
    reddit_posts: int
    reddit_comments: int
    youtube_posts: int
    youtube_comments: int
    total_engagement: int

ChatResponse = Union[TextResponse, ChartResponse]

class TimeSeriesData(BaseModel):
    date: str; youtube_comments: int; reddit_comments: int

app = FastAPI(
    title="Data Insights API",
    description="An API to serve analytics from YouTube and Reddit data.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = None

# def get_db_connection():
#     """Get database connection"""
#     db_name = os.getenv('SQL_DB_NAME', 'insights.db')
#     return sqlite3.connect(db_name)

def get_db_connection():
    """Get database connection to Postgres"""
    return SQL_ENGINE.connect()

# @app.on_event("startup")
# async def startup_event():
#     """Initialize the agent on startup"""
#     global agent
#     try:
#         agent = create_agent()
#         print("✅ Agent initialized successfully")
#     except Exception as e:
#         print(f"❌ Failed to initialize agent: {e}")
#         raise e

@app.get("/")
def home():
    return {"message": "Welcome to the Data Insights API!"}

@app.get("/api/summary", response_model=OverallSummary)
def get_overall_summary():
    """
    Provides a comprehensive summary from all four data tables.
    """
    try:
        with SQL_ENGINE.connect() as connection:
            yt_comments_count = pd.read_sql_query('SELECT COUNT(*) as count FROM youtube_comments', connection).iloc[0]['count']
            rd_comments_count = pd.read_sql_query('SELECT COUNT(*) as count FROM reddit_comments', connection).iloc[0]['count']
            yt_posts_count = pd.read_sql_query('SELECT COUNT(*) as count FROM youtube_posts', connection).iloc[0]['count']
            rd_posts_count = pd.read_sql_query('SELECT COUNT(*) as count FROM reddit_posts', connection).iloc[0]['count']
            
            top_rd_posts_df = pd.read_sql_query('SELECT title, ups FROM reddit_posts ORDER BY ups DESC LIMIT 5', connection)
            
            # Get top 5 YouTube posts by views
            top_yt_posts_df = pd.read_sql_query('SELECT title, views FROM youtube_posts ORDER BY views DESC LIMIT 5', connection)

            return {
                "total_youtube_comments": int(yt_comments_count),
                "total_reddit_comments": int(rd_comments_count),
                "total_youtube_posts": int(yt_posts_count),
                "total_reddit_posts": int(rd_posts_count),
                "top_reddit_posts": top_rd_posts_df.to_dict(orient='records'),
                "top_youtube_posts": top_yt_posts_df.to_dict(orient='records')
            }
    except Exception as e:
        return {"error": str(e)}

# @app.post("/api/chat", response_model=ChatResponse)
# def handle_chat_query(query: ChatQuery):
#     try:
#         query_embedding = embedding_model.encode(query.query).tolist()
#         # Query logic is the same, but uses the new `pinecone_index` object
#         query_results = pinecone_index.query(
#             vector=query_embedding,
#             top_k=5,
#             include_metadata=True
#         )
#         results = [
#             {"text": match['metadata']['text'], "source": match['metadata']['source']}
#             for match in query_results['matches']
#         ]
#         return {"results": results}
#     except Exception as e:
#         print(f"Error during chat query: {e}"); return {"results": []}

@app.post("/api/chat")
async def handle_chat_query(query: ChatQuery) -> Union[TextResponse, ChartResponse]:
    """
    Main endpoint to handle user queries.
    Routes queries to appropriate tools based on content analysis.
    """
    global agent
    
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    if not query.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        print(f"Processing query: {query.query}")
        
        result = await agent.process_query(query.query)
        
    
        if result["type"] == "chart":
            return ChartResponse(
                type="chart",
                content=result["content"],
                summary=result.get("summary", "Chart generated successfully")
            )
        else:
            return TextResponse(
                type="text",
                content=result["content"]
            )
            
    except Exception as e:
        print(f"Error in chat handler: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred while processing your query: {str(e)}"
        )


# @app.post("/api/chat", response_model=ChatResponse)
# async def handle_chat_query(query: ChatQuery):
#     """
#     Receives a user query and passes it to the single, powerful agent executor.
#     The agent handles all reasoning, tool use, and response formatting internally.
#     """
#     try:
#         # Invoke the agent with the user's input
#         response = await agent_executor.ainvoke({"input": query.query})
#         agent_output = response.get("output", "I'm sorry, I encountered an issue and could not get a response.")

#         # Check if the agent's final answer contains the special chart data tag
#         chart_data_match = re.search(r"\[CHART_DATA\](.*?)\[/CHART_DATA\]", agent_output, re.DOTALL)

#         if chart_data_match:
#             chart_data_str = chart_data_match.group(1).strip()
#             summary = re.sub(r"\[CHART_DATA\](.*?)\[/CHART_DATA\]", "", agent_output, flags=re.DOTALL).strip()
            
#             try:
#                 # The SQL tool returns a string representation of a list of dicts. We parse it here.
#                 chart_data = json.loads(chart_data_str.replace("'", '"'))
                
#                 return {
#                     "type": "chart",
#                     "content": {"chartType": "bar", "data": chart_data, "title": f"Results for: '{query.query}'"}, # Chart type can be improved later
#                     "summary": summary or "Here is the visualization you requested."
#                 }
#             except (json.JSONDecodeError, IndexError):
#                 # If parsing fails, return the raw data as text to the user
#                 return {"type": "text", "content": f"I found the following data but couldn't create a chart:\n\n{chart_data_str}"}
#         else:
#             # If no chart data tag, return the agent's entire output as plain text
#             return {"type": "text", "content": agent_output}

#     except Exception as e:
#         print(f"FATAL: Error in agent execution: {e}")
#         raise HTTPException(status_code=500, detail=f"An error occurred in the agent's reasoning process. Error: {str(e)}")


@app.get("/api/timeseries", response_model=List[TimeSeriesData])
def get_timeseries_data():
    """Provides daily counts of comments for time-series analysis."""
    try:
        with SQL_ENGINE.connect() as connection:
            yt_df = pd.read_sql_query(
                text("SELECT date_of_comment FROM youtube_comments"),
                connection,
                parse_dates=['date_of_comment']
            )
            rd_df = pd.read_sql_query(
                text("SELECT date_of_comment FROM reddit_comments"),
                connection,
                parse_dates=['date_of_comment']
            )

            yt_df.dropna(subset=['date_of_comment'], inplace=True)
            rd_df.dropna(subset=['date_of_comment'], inplace=True)

            yt_counts = (
                yt_df.set_index('date_of_comment').resample('D').size().rename('youtube_comments')
                if not yt_df.empty else pd.Series([], name='youtube_comments', dtype='int64')
            )
            rd_counts = (
                rd_df.set_index('date_of_comment').resample('D').size().rename('reddit_comments')
                if not rd_df.empty else pd.Series([], name='reddit_comments', dtype='int64')
            )

            combined_df = (
                pd.concat([yt_counts, rd_counts], axis=1)
                .fillna(0)
                .astype(int)
                .reset_index()
                .rename(columns={'date_of_comment': 'date'})  
            )

            combined_df['date'] = combined_df['date'].dt.strftime('%Y-%m-%d')

            return combined_df.to_dict(orient='records')
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error fetching time-series data: {e}")

@app.get("/api/analytics/overview")
async def get_analytics_overview() -> AnalyticsResponse:
    """Get comprehensive analytics overview"""
    try:
        with get_db_connection() as conn:
            # Counts
            reddit_posts = conn.execute(text("SELECT COUNT(*) FROM reddit_posts")).scalar()
            youtube_posts = conn.execute(text("SELECT COUNT(*) FROM youtube_posts")).scalar()
            reddit_comments = conn.execute(text("SELECT COUNT(*) FROM reddit_comments")).scalar()
            youtube_comments = conn.execute(text("SELECT COUNT(*) FROM youtube_comments")).scalar()

            # Engagement stats
            engagement_data = conn.execute(text("""
                SELECT 
                    AVG(views::float) as avg_views,
                    AVG(engagement::float) as avg_engagement,
                    MAX(views::float) as max_views,
                    SUM(engagement::float) as total_engagement
                FROM (
                    SELECT views, engagement FROM reddit_posts WHERE views IS NOT NULL
                    UNION ALL
                    SELECT views, engagement FROM youtube_posts WHERE views IS NOT NULL
                ) AS combined
            """)).fetchone()

            # Sentiment overview
            sentiment_data = conn.execute(text("""
                SELECT 
                    AVG(sentiment_positive) as avg_positive,
                    AVG(sentiment_negative) as avg_negative,
                    AVG(sentiment_neutral) as avg_neutral
                FROM (
                    SELECT sentiment_positive, sentiment_negative, sentiment_neutral FROM reddit_posts
                    UNION ALL
                    SELECT sentiment_positive, sentiment_negative, sentiment_neutral FROM youtube_posts
                    UNION ALL
                    SELECT sentiment_positive, sentiment_negative, sentiment_neutral FROM reddit_comments
                    UNION ALL
                    SELECT sentiment_positive, sentiment_negative, sentiment_neutral FROM youtube_comments
                ) AS combined
            """)).fetchone()

            # Top Reddit posts (by engagement)
            top_reddit = conn.execute(text("""
                SELECT title, views, engagement FROM reddit_posts 
                WHERE title IS NOT NULL AND views IS NOT NULL
                ORDER BY engagement::integer DESC 
                LIMIT 10
            """)).fetchall()

            # Top YouTube posts (by views)
            top_youtube = conn.execute(text("""
                SELECT title, views, engagement FROM youtube_posts 
                WHERE title IS NOT NULL AND views IS NOT NULL
                ORDER BY views::integer DESC 
                LIMIT 10
            """)).fetchall()

        # Response
        return AnalyticsResponse(
            total_posts=reddit_posts + youtube_posts,
            total_comments=reddit_comments + youtube_comments,
            platforms={
                "reddit": {
                    "posts": reddit_posts,
                    "comments": reddit_comments
                },
                "youtube": {
                    "posts": youtube_posts,
                    "comments": youtube_comments
                }
            },
            engagement_stats={
                "average_views": round(engagement_data[0] or 0, 2),
                "average_engagement": round(engagement_data[1] or 0, 2),
                "max_views": int(engagement_data[2] or 0),
                "total_engagement": int(engagement_data[3] or 0)
            },
            sentiment_overview={
                "positive": round((sentiment_data[0] or 0) * 100, 1),
                "negative": round((sentiment_data[1] or 0) * 100, 1),
                "neutral": round((sentiment_data[2] or 0) * 100, 1)
            },
            top_keywords=[
                {"keyword": f"Reddit: {title[:50]}...", "count": engagement}
                for title, views, engagement in top_reddit[:5]
            ] + [
                {"keyword": f"YouTube: {title[:50]}...", "count": views}
                for title, views, engagement in top_youtube[:5]
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@app.get("/api/trends/activity")
async def get_activity_trends():
    """Get activity trends over time (Postgres version)"""
    try:
        with get_db_connection() as conn:
            results = conn.execute(text("""
                WITH daily_stats AS (
                    SELECT 
                        DATE(timestamp::timestamp) as date,
                        'reddit' as platform,
                        'post' as type,
                        COUNT(*) as count,
                        SUM(engagement::integer) as total_engagement
                    FROM reddit_posts 
                    WHERE timestamp::timestamp >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY DATE(timestamp::timestamp)
                    
                    UNION ALL
                    
                    SELECT 
                        DATE(timestamp::timestamp) as date,
                        'youtube' as platform,
                        'post' as type,
                        COUNT(*) as count,
                        SUM(engagement::integer) as total_engagement
                    FROM youtube_posts 
                    WHERE timestamp::timestamp >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY DATE(timestamp::timestamp)
                    
                    UNION ALL
                    
                    SELECT 
                        DATE(date_of_comment::timestamp) as date,
                        'reddit' as platform,
                        'comment' as type,
                        COUNT(*) as count,
                        SUM(likes::integer) as total_engagement
                    FROM reddit_comments 
                    WHERE date_of_comment::timestamp >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY DATE(date_of_comment::timestamp)
                    
                    UNION ALL
                    
                    SELECT 
                        DATE(date_of_comment::timestamp) as date,
                        'youtube' as platform,
                        'comment' as type,
                        COUNT(*) as count,
                        SUM(likes::integer) as total_engagement
                    FROM youtube_comments 
                    WHERE date_of_comment::timestamp >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY DATE(date_of_comment::timestamp)
                )
                SELECT 
                    date,
                    SUM(CASE WHEN platform = 'reddit' AND type = 'post' THEN count ELSE 0 END) as reddit_posts,
                    SUM(CASE WHEN platform = 'reddit' AND type = 'comment' THEN count ELSE 0 END) as reddit_comments,
                    SUM(CASE WHEN platform = 'youtube' AND type = 'post' THEN count ELSE 0 END) as youtube_posts,
                    SUM(CASE WHEN platform = 'youtube' AND type = 'comment' THEN count ELSE 0 END) as youtube_comments,
                    SUM(total_engagement) as total_engagement
                FROM daily_stats
                GROUP BY date
                ORDER BY date
            """)).fetchall()

            return [
                {
                    "date": row[0],
                    "reddit_posts": row[1],
                    "reddit_comments": row[2],
                    "youtube_posts": row[3],
                    "youtube_comments": row[4],
                    "total_engagement": row[5] or 0
                }
                for row in results
            ]
    except Exception as e:
        tb = traceback.format_exc()
        print(f"❌ Error in get_activity_trends:\n{tb}")
        raise HTTPException(status_code=500, detail=f"Trends error: {str(e)}")

@app.get("/api/sentiment/analysis")
async def get_sentiment_analysis():
    """Get detailed sentiment analysis (Postgres version with timestamp casting)"""
    try:
        with get_db_connection() as conn:
            # Sentiment by category
            sentiment_data = conn.execute(text("""
                SELECT 
                    'Reddit Posts' as category,
                    AVG(sentiment_positive) * 100 as positive,
                    AVG(sentiment_negative) * 100 as negative,
                    AVG(sentiment_neutral) * 100 as neutral,
                    COUNT(*) as total_items
                FROM reddit_posts WHERE sentiment_positive IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'YouTube Posts' as category,
                    AVG(sentiment_positive) * 100 as positive,
                    AVG(sentiment_negative) * 100 as negative,
                    AVG(sentiment_neutral) * 100 as neutral,
                    COUNT(*) as total_items
                FROM youtube_posts WHERE sentiment_positive IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'Reddit Comments' as category,
                    AVG(sentiment_positive) * 100 as positive,
                    AVG(sentiment_negative) * 100 as negative,
                    AVG(sentiment_neutral) * 100 as neutral,
                    COUNT(*) as total_items
                FROM reddit_comments WHERE sentiment_positive IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'YouTube Comments' as category,
                    AVG(sentiment_positive) * 100 as positive,
                    AVG(sentiment_negative) * 100 as negative,
                    AVG(sentiment_neutral) * 100 as neutral,
                    COUNT(*) as total_items
                FROM youtube_comments WHERE sentiment_positive IS NOT NULL
            """)).fetchall()

            # Sentiment trends over last 14 days
            trend_data = conn.execute(text("""
                WITH max_ts AS (
                    SELECT MAX(ts) as max_timestamp
                    FROM (
                        SELECT timestamp::timestamp as ts FROM reddit_posts
                        UNION ALL
                        SELECT timestamp::timestamp as ts FROM youtube_posts
                    ) AS combined
                ),
                daily_sentiment AS (
                    SELECT 
                        DATE(ts) as date,
                        AVG(sentiment_positive) as positive,
                        AVG(sentiment_negative) as negative,
                        AVG(sentiment_neutral) as neutral
                    FROM (
                        SELECT timestamp::timestamp as ts, sentiment_positive, sentiment_negative, sentiment_neutral 
                        FROM reddit_posts
                        UNION ALL
                        SELECT timestamp::timestamp as ts, sentiment_positive, sentiment_negative, sentiment_neutral 
                        FROM youtube_posts
                    ) AS combined
                    WHERE ts >= (
                        SELECT max_timestamp - INTERVAL '14 days' FROM max_ts
                    )
                    GROUP BY DATE(ts)
                    ORDER BY DATE(ts)
                )
                SELECT * FROM daily_sentiment
            """)).fetchall()

            return {
                "platform_sentiment": [
                    {
                        "category": row[0],
                        "positive": round(row[1] or 0, 2),
                        "negative": round(row[2] or 0, 2),
                        "neutral": round(row[3] or 0, 2),
                        "total_items": row[4]
                    }
                    for row in sentiment_data
                ],
                "sentiment_trends": [
                    {
                        "date": row[0],
                        "positive": round((row[1] or 0) * 100, 2),
                        "negative": round((row[2] or 0) * 100, 2),
                        "neutral": round((row[3] or 0) * 100, 2)
                    }
                    for row in trend_data
                ]
            }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sentiment analysis error: {str(e)}")

@app.get("/api/engagement/leaderboard")
async def get_engagement_leaderboard():
    """Get top performing content across platforms (Postgres version)"""
    try:
        with get_db_connection() as conn:
            # Top Reddit posts
            top_reddit = conn.execute(text("""
                SELECT 
                    title,
                    username,
                    views::integer as views,
                    engagement::integer as engagement,
                    ups::integer as ups,
                    'reddit' as platform
                FROM reddit_posts 
                WHERE views IS NOT NULL AND title IS NOT NULL
                ORDER BY engagement::integer DESC 
                LIMIT 10
            """)).fetchall()
            
            # Top YouTube posts
            top_youtube = conn.execute(text("""
                SELECT 
                    title,
                    username,
                    views::integer as views,
                    engagement::integer as engagement,
                    comments::integer as comments,
                    'youtube' as platform
                FROM youtube_posts 
                WHERE views IS NOT NULL AND title IS NOT NULL
                ORDER BY engagement::integer DESC 
                LIMIT 10
            """)).fetchall()
            
            # Top comments (Reddit + YouTube)
            top_comments = conn.execute(text("""
                SELECT text, username, likes, platform FROM (
                    SELECT 
                        text,
                        username,
                        likes::integer as likes,
                        'reddit' as platform
                    FROM reddit_comments 
                    WHERE likes IS NOT NULL AND text IS NOT NULL
                    ORDER BY likes::integer DESC 
                    LIMIT 5
                ) AS reddit_top
                UNION ALL
                SELECT text, username, likes, platform FROM (
                    SELECT 
                        text,
                        username,
                        likes::integer as likes,
                        'youtube' as platform
                    FROM youtube_comments 
                    WHERE likes IS NOT NULL AND text IS NOT NULL
                    ORDER BY likes::integer DESC 
                    LIMIT 5
                ) AS youtube_top
            """)).fetchall()
            
            return {
                "top_posts": {
                    "reddit": [
                        {
                            "title": row[0][:100] + "..." if len(row[0]) > 100 else row[0],
                            "username": row[1],
                            "views": row[2],
                            "engagement": row[3],
                            "ups": row[4],
                            "platform": row[5]
                        }
                        for row in top_reddit
                    ],
                    "youtube": [
                        {
                            "title": row[0][:100] + "..." if len(row[0]) > 100 else row[0],
                            "username": row[1],
                            "views": row[2],
                            "engagement": row[3],
                            "comments": row[4],
                            "platform": row[5]
                        }
                        for row in top_youtube
                    ]
                },
                "top_comments": [
                    {
                        "text": row[0][:200] + "..." if len(row[0]) > 200 else row[0],
                        "username": row[1],
                        "likes": row[2],
                        "platform": row[3]
                    }
                    for row in top_comments
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Leaderboard error: {str(e)}")

@app.get("/api/insights/toxicity")
async def get_toxicity_insights():
    """Get toxicity analysis"""
    try:
        with SQL_ENGINE.connect() as conn:
            # Toxicity distribution
            toxicity_query = text("""
                SELECT 
                    toxicity,
                    COUNT(*) as count,
                    'posts' as type
                FROM (
                    SELECT toxicity FROM reddit_posts WHERE toxicity IS NOT NULL
                    UNION ALL
                    SELECT toxicity FROM youtube_posts WHERE toxicity IS NOT NULL
                ) AS posts
                GROUP BY toxicity
                
                UNION ALL
                
                SELECT 
                    toxicity,
                    COUNT(*) as count,
                    'comments' as type
                FROM (
                    SELECT toxicity FROM reddit_comments WHERE toxicity IS NOT NULL
                    UNION ALL
                    SELECT toxicity FROM youtube_comments WHERE toxicity IS NOT NULL
                ) AS comments
                GROUP BY toxicity
            """)
            toxicity_data = conn.execute(toxicity_query).fetchall()

            # Platform comparison
            platform_query = text("""
                SELECT 
                    'Reddit' as platform,
                    SUM(CASE WHEN toxicity = 'toxic' THEN 1 ELSE 0 END) as toxic_count,
                    COUNT(*) as total_count
                FROM (
                    SELECT toxicity FROM reddit_posts WHERE toxicity IS NOT NULL
                    UNION ALL
                    SELECT toxicity FROM reddit_comments WHERE toxicity IS NOT NULL
                ) AS reddit_data
                
                UNION ALL
                
                SELECT 
                    'YouTube' as platform,
                    SUM(CASE WHEN toxicity = 'toxic' THEN 1 ELSE 0 END) as toxic_count,
                    COUNT(*) as total_count
                FROM (
                    SELECT toxicity FROM youtube_posts WHERE toxicity IS NOT NULL
                    UNION ALL
                    SELECT toxicity FROM youtube_comments WHERE toxicity IS NOT NULL
                ) AS youtube_data
            """)
            platform_toxicity = conn.execute(platform_query).fetchall()

            return {
                "toxicity_distribution": [
                    {
                        "category": f"{row[2].title()} - {row[0]}",
                        "count": row[1],
                        "level": row[0]
                    }
                    for row in toxicity_data
                ],
                "platform_comparison": [
                    {
                        "platform": row[0],
                        "toxic_percentage": round((row[1] / row[2]) * 100, 2) if row[2] > 0 else 0,
                        "toxic_count": row[1],
                        "total_count": row[2]
                    }
                    for row in platform_toxicity
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Toxicity analysis error: {str(e)}")

@app.get("/api/content/popular")
async def get_popular_content():
    """Get most popular content with detailed metrics"""
    try:
        with SQL_ENGINE.connect() as conn:
            query = text("""
                SELECT * FROM (
                    SELECT 
                        title,
                        username,
                        CAST(views AS INTEGER) as views,
                        CAST(engagement AS INTEGER) as engagement,
                        CAST(comments AS INTEGER) as comment_count,
                        sentiment_positive,
                        timestamp,
                        'reddit' as platform
                    FROM reddit_posts 
                    WHERE views IS NOT NULL AND title IS NOT NULL
                    ORDER BY CAST(views AS INTEGER) DESC 
                    LIMIT 15
                ) AS r
                UNION ALL
                SELECT * FROM (
                    SELECT 
                        title,
                        username,
                        CAST(views AS INTEGER) as views,
                        CAST(engagement AS INTEGER) as engagement,
                        CAST(comments AS INTEGER) as comment_count,
                        sentiment_positive,
                        timestamp,
                        'youtube' as platform
                    FROM youtube_posts 
                    WHERE views IS NOT NULL AND title IS NOT NULL
                    ORDER BY CAST(views AS INTEGER) DESC 
                    LIMIT 15
                ) AS y
            """)

            result = conn.execute(query).fetchall()

            popular_content = [
                {
                    "title": row[0][:120] + "..." if row[0] and len(row[0]) > 120 else row[0],
                    "username": row[1],
                    "views": row[2],
                    "engagement": row[3],
                    "comments": row[4],
                    "sentiment_score": round((row[5] or 0) * 100, 1),
                    "timestamp": row[6],
                    "platform": row[7]
                }
                for row in result
            ]

            return popular_content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Popular content error: {str(e)}")

@app.get("/api/search/trending")
async def get_trending_keywords():
    """Get trending keywords and topics"""
    try:
        with SQL_ENGINE.connect() as conn:
            query = text("""
                WITH latest AS (
                    SELECT MAX(CAST(timestamp AS TIMESTAMP)) AS max_ts FROM reddit_posts
                    UNION ALL
                    SELECT MAX(CAST(timestamp AS TIMESTAMP)) AS max_ts FROM youtube_posts
                ),
                global_latest AS (
                    SELECT MAX(max_ts) AS latest_timestamp FROM latest
                ),
                reddit_data AS (
                    SELECT title, CAST(engagement AS INTEGER) as engagement, 'reddit' as platform
                    FROM reddit_posts, global_latest
                    WHERE title IS NOT NULL 
                      AND engagement IS NOT NULL 
                      AND CAST(timestamp AS TIMESTAMP) >= (global_latest.latest_timestamp - interval '7 days')
                    ORDER BY CAST(engagement AS INTEGER) DESC 
                    LIMIT 50
                ),
                youtube_data AS (
                    SELECT title, CAST(engagement AS INTEGER) as engagement, 'youtube' as platform
                    FROM youtube_posts, global_latest
                    WHERE title IS NOT NULL 
                      AND engagement IS NOT NULL 
                      AND CAST(timestamp AS TIMESTAMP) >= (global_latest.latest_timestamp - interval '7 days')
                    ORDER BY CAST(engagement AS INTEGER) DESC 
                    LIMIT 50
                )
                SELECT * FROM reddit_data
                UNION ALL
                SELECT * FROM youtube_data;
            """)
            result = conn.execute(query)
            trending_posts = result.fetchall()

            # --- Keyword Processing ---
            keyword_counts = defaultdict(int)
            stopwords = {"this", "that", "with", "from", "they", "have", "been", "will", "what", "when", "where"}

            for title, engagement, platform in trending_posts:
                words = re.findall(r'\b\w{4,}\b', title.lower())
                for word in words:
                    if word not in stopwords:
                        keyword_counts[word] += engagement

            trending_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:20]

            return [
                {
                    "keyword": keyword,
                    "engagement_score": score,
                    "frequency": sum(1 for p in trending_posts if keyword in p[0].lower())
                }
                for keyword, score in trending_keywords
            ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trending keywords error: {str(e)}")

@app.get("/api/realtime/activity")
async def get_realtime_activity():
    """Get real-time activity metrics from Postgres"""
    try:
        with SQL_ENGINE.connect() as conn:
            query = text("""
                SELECT 
                    TO_CHAR(timestamp::timestamptz, 'HH24') AS hour,
                    COUNT(*) AS activity_count,
                    AVG(engagement::FLOAT) AS avg_engagement
                FROM (
                    SELECT timestamp::timestamptz, engagement 
                    FROM reddit_posts 
                    WHERE timestamp::timestamptz >= NOW() - INTERVAL '1 day'
                    
                    UNION ALL
                    
                    SELECT timestamp::timestamptz, engagement 
                    FROM youtube_posts 
                    WHERE timestamp::timestamptz >= NOW() - INTERVAL '1 day'
                ) sub
                GROUP BY TO_CHAR(timestamp::timestamptz, 'HH24')
                ORDER BY hour
            """)

            rows = conn.execute(query).mappings().all()

            return [
                {
                    "hour": f"{int(row['hour']):02d}:00" if row["hour"] else None,
                    "activity_count": row["activity_count"],
                    "avg_engagement": round(row["avg_engagement"] or 0, 2)
                }
                for row in rows
            ]

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Real-time activity error: {str(e)}")


@app.get("/api/insights/user-analysis")
async def get_user_analysis():
    """Get user behavior analysis"""
    try:
        with get_db_connection() as conn:
            # -------------------------
            # Top contributors
            # -------------------------
            top_users = conn.execute(text("""
                (
                    SELECT 
                        username,
                        COUNT(*) AS post_count,
                        SUM(engagement::INTEGER) AS total_engagement,
                        AVG(engagement::INTEGER) AS avg_engagement,
                        'reddit' AS platform
                    FROM reddit_posts 
                    WHERE username IS NOT NULL AND engagement IS NOT NULL
                    GROUP BY username
                    ORDER BY SUM(engagement::INTEGER) DESC
                    LIMIT 10
                )
                UNION ALL
                (
                    SELECT 
                        username,
                        COUNT(*) AS post_count,
                        SUM(engagement::INTEGER) AS total_engagement,
                        AVG(engagement::INTEGER) AS avg_engagement,
                        'youtube' AS platform
                    FROM youtube_posts 
                    WHERE username IS NOT NULL AND engagement IS NOT NULL
                    GROUP BY username
                    ORDER BY SUM(engagement::INTEGER) DESC
                    LIMIT 10
                )
            """)).fetchall()

            # -------------------------
            # User engagement distribution
            # -------------------------
            engagement_distribution = conn.execute(text("""
                SELECT *
                FROM (
                    SELECT 
                        CASE 
                            WHEN engagement < 100 THEN '0-100'
                            WHEN engagement < 500 THEN '100-500'
                            WHEN engagement < 1000 THEN '500-1K'
                            WHEN engagement < 5000 THEN '1K-5K'
                            ELSE '5K+'
                        END AS engagement_range,
                        COUNT(*) AS user_count
                    FROM (
                        SELECT username, SUM(engagement::INTEGER) AS engagement
                        FROM reddit_posts 
                        WHERE engagement IS NOT NULL
                        GROUP BY username

                        UNION ALL

                        SELECT username, SUM(engagement::INTEGER) AS engagement
                        FROM youtube_posts 
                        WHERE engagement IS NOT NULL
                        GROUP BY username
                    ) AS combined
                    GROUP BY 
                        CASE 
                            WHEN engagement < 100 THEN '0-100'
                            WHEN engagement < 500 THEN '100-500'
                            WHEN engagement < 1000 THEN '500-1K'
                            WHEN engagement < 5000 THEN '1K-5K'
                            ELSE '5K+'
                        END
                ) AS engagement_buckets
                ORDER BY 
                    CASE engagement_range
                        WHEN '0-100' THEN 1
                        WHEN '100-500' THEN 2
                        WHEN '500-1K' THEN 3
                        WHEN '1K-5K' THEN 4
                        WHEN '5K+' THEN 5
                    END
            """)).fetchall()
            
            # -------------------------
            # Build response
            # -------------------------
            return {
                "top_contributors": [
                    {
                        "username": row[0],
                        "post_count": row[1],
                        "total_engagement": row[2],
                        "avg_engagement": round(row[3], 2) if row[3] is not None else 0,
                        "platform": row[4]
                    }
                    for row in top_users
                ],
                "engagement_distribution": [
                    {
                        "range": row[0],
                        "user_count": row[1]
                    }
                    for row in engagement_distribution
                ]
            }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"User analysis error: {str(e)}")
