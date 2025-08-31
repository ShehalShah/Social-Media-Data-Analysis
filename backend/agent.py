import os
import json
import re
from typing import Dict, Any, List, Tuple, Optional
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_community.utilities.sql_database import SQLDatabase
from langchain.tools import BaseTool
from langchain.schema import HumanMessage
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import sqlite3
from pydantic import PrivateAttr

class SQLQueryTool(BaseTool):
    name: str = "sql_query"
    description: str = "Execute SQL queries on the database. Use for specific data questions, counts, analytics, etc."

    _db: SQLDatabase = PrivateAttr()

    def __init__(self, db: SQLDatabase, **kwargs):
        super().__init__(**kwargs)
        self._db = db

    def _run(self, query: str) -> str:
        try:
            query = query.strip()
            if not query.upper().startswith(('SELECT', 'WITH')):
                return f"Error: Only SELECT queries are allowed. Got: {query[:50]}..."
            result = self._db.run(query)
            if not result or result.strip() == "[]":
                return "No data found for this query."
            return result
        except Exception as e:
            return f"SQL Error: {str(e)}"

class SQLSchemaTool(BaseTool):
    """Tool to get database schema information"""
    name: str = "sql_schema"
    description: str = "Get database schema and table information. Use when you need to understand the database structure."
    
    _db: SQLDatabase = PrivateAttr()

    def __init__(self, db: SQLDatabase, **kwargs):
        super().__init__(**kwargs)
        self._db = db

    
    def _run(self, table_name: str = "") -> str:
        try:
            if table_name:
                return self._db.get_table_info([table_name])
            else:
                return self._db.get_table_info()
        except Exception as e:
            return f"Schema Error: {str(e)}"

class SemanticSearchTool(BaseTool):
    """Tool for semantic/vector search with full post/comment retrieval"""
    name: str = "semantic_search"
    description: str = "Search for content based on semantic similarity. Returns table, row_id, snippet, and full text."
    
    _index: Any = PrivateAttr()
    _embedding_model: Any = PrivateAttr()
    _db_engine: Any = PrivateAttr() 

    def __init__(self, index, embedding_model, db_engine=None, **kwargs):
        super().__init__(**kwargs)
        self._index = index
        self._embedding_model = embedding_model
        self._db_engine = db_engine
    
    def _run(self, query: str) -> str:
        try:
            query_embedding = self._embedding_model.encode(query).tolist()
            results = self._index.query(
                vector=query_embedding,
                top_k=5,
                include_metadata=True
            )
            
            if not results.matches:
                return "[]"
            
            formatted_results = []
            for match in results.matches:
                try:
                    table_name, row_id_str = match.id.rsplit("_", 1)
                    row_id = int(row_id_str)
                except Exception:
                    table_name = match.metadata.get("source", "unknown")
                    row_id = None

                content = match.metadata.get("text", "No content available")
                snippet = content[:200] + "..." if len(content) > 200 else content

                full_content = content
                if self._db_engine and row_id:
                    try:
                        sql = f"SELECT * FROM {table_name} WHERE source_id = {row_id}"
                        df = pd.read_sql(sql, self._db_engine)
                        if not df.empty:
                            full_content = df.iloc[0].to_dict()
                    except Exception as e:
                        pass

                formatted_results.append({
                    "table_name": table_name,
                    "row_id": row_id,
                    "source": match.metadata.get("source", table_name),
                    "content_snippet": snippet,
                    "full_content": full_content,
                    "relevance_score": round(match.score, 3)
                })
            
            return json.dumps(formatted_results, indent=2)
        
        except Exception as e:
            return f"Semantic Search Error: {str(e)}"

class DataAnalysisAgent:
    """Main agent class that orchestrates all operations"""
    
    def __init__(self):
        self.db = SQLDatabase.from_uri(
            f"sqlite:///{os.getenv('SQL_DB_NAME', 'insights.db')}", 
            sample_rows_in_table_info=3
        )
        
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.pinecone_index = self.pc.Index(os.getenv("PINECONE_INDEX_NAME", 'insights-index'))
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0
        )
        # self.llm = ChatGoogleGenerativeAI(
        #     model="gemini-1.5-flash",
        #     temperature=0,
        #     google_api_key=os.getenv("GEMINI_API_KEY")
        # )
        
        self.sql_query_tool = SQLQueryTool(self.db)
        self.sql_schema_tool = SQLSchemaTool(self.db)
        self.semantic_search_tool = SemanticSearchTool(self.pinecone_index, self.embedding_model)
    
    # def _classify_query(self, query: str) -> str:
    #     """Classify the type of query to determine the best approach"""
    #     query_lower = query.lower()
        
    #     # Chart/visualization keywords
    #     chart_keywords = ['chart', 'graph', 'plot', 'visualize', 'visualization', 'distribution', 'bar chart', 'pie chart', 'histogram']
    #     if any(keyword in query_lower for keyword in chart_keywords):
    #         return "chart_query"
        
    #     # Specific data queries (use SQL)
    #     sql_keywords = ['count', 'how many', 'average', 'sum', 'total', 'list', 'show me', 'find', 'get', 'top', 'bottom', 'highest', 'lowest', 'between', 'before', 'after']
    #     if any(keyword in query_lower for keyword in sql_keywords):
    #         return "sql_query"
        
    #     # Semantic/analysis queries
    #     semantic_keywords = ['analysis', 'opinion', 'sentiment', 'what do people think', 'general consensus', 'overview', 'summarize', 'explain', 'insights', 'trends', 'what are people saying']
    #     if any(keyword in query_lower for keyword in semantic_keywords):
    #         return "semantic_query"
        
    #     # Default to SQL for most other queries
    #     return "sql_query"

    def _classify_query(self, query: str) -> str:
        """Classify the type of query using LLM (Gemini)"""
        prompt = f"""
        You are a query classification agent. 
        Classify the following user query into one of these categories:
        - "sql_query": if the query is about retrieving or calculating structured data (counts, sums, averages, lists, filters, etc.).
        - "chart_query": if the query is about creating a chart, graph, plot, visualization, or distribution.
        - "semantic_query": if the query asks for analysis, insights, opinions, trends, sentiment, or summaries.

        Query: "{query}"

        Answer with only one of these labels: sql_query, chart_query, semantic_query.
        """

        response = self.llm.invoke(prompt)
        classification = response.content.strip().lower()

        # Fallback if LLM responds with unexpected output
        if classification not in ["sql_query", "chart_query", "semantic_query"]:
            classification = "sql_query"

        return classification

    
    def _extract_sql_data(self, sql_result: str) -> List[Dict]:
        """Extract and parse SQL result data"""
        try:
            if sql_result.startswith('[') and sql_result.endswith(']'):
                data = eval(sql_result)
                if isinstance(data, list) and data:
                    if isinstance(data[0], tuple):
                        return [{"value": item} for item in data]
                    return data
            return []
        except:
            return []
    
    def _generate_chart_data(self, sql_result: str, query: str) -> Optional[Dict]:
        """Generate chart data from SQL results"""
        try:
            data = self._extract_sql_data(sql_result)
            if not data:
                return None
            
            chart_type = "bar" 
            
            if "distribution" in query.lower() or "histogram" in query.lower():
                chart_type = "histogram"
            elif "pie" in query.lower():
                chart_type = "pie"
            elif "line" in query.lower() or "trend" in query.lower():
                chart_type = "line"
            
            return {
                "chartType": chart_type,
                "data": data,
                "title": f"Analysis Results for: {query}"
            }
        except Exception as e:
            print(f"Chart generation error: {e}")
            return None
    
    def _get_sql_schema(self) -> str:
        """Get database schema"""
        return self.sql_schema_tool._run("")
    
    def _execute_sql_query(self, query: str) -> str:
        """Execute SQL query with schema awareness"""
        if "table" in query.lower() or "schema" in query.lower():
            schema = self._get_sql_schema()
            return schema
        
        return self.sql_query_tool._run(query)
    
    def _perform_semantic_search(self, query: str) -> str:
        """Perform semantic search"""
        return self.semantic_search_tool._run(query)
    
    def _generate_sql_query(self, user_query: str) -> Tuple[str, Optional[str]]:
        """Generate SQL query (and chart type if requested) using LLM"""
        schema = self._get_sql_schema()
        
        prompt = f"""
        Based on this database schema:
        {schema}
        
        Generate output for this user question: "{user_query}"
        
        Rules:
        1. Always generate a SINGLE, VALID SQL SELECT query. The database is **SQLite**, not PostgreSQL or MySQL. Always generate SQLite-compatible SQL.
        2. If the user explicitly asks for a chart/graph/visualization/plot, also specify the chart type.
        3. When generating chart queries, always include BOTH:
        - The metric to be plotted (e.g., likes, count, score).
        - A human-readable identifier (e.g., comment_text, username, title, url) for labeling the x-axis or legend.
        4. Allowed chart types: bar, line, pie, histogram, scatter, area. If no chart requested, use null.
        5. Output STRICTLY as JSON with exactly these two keys:
        {{
            "sql": "<SQL query>",
            "chart_type": "<one of: bar, line, pie, histogram, scatter, area, null>"
        }}
        6. Do not include explanations, markdown, or text outside JSON.
        7. Use valid SQLite-compatible SQL only (e.g., DATE(), strftime()).
        """

        response = self.llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()

        sql_query, chart_type = "", None
        try:
            parsed = json.loads(raw)
            sql_query = parsed.get("sql", "").strip()
            chart_type = parsed.get("chart_type", None)
        except Exception:
            match = re.search(r"\{[\s\S]*\}", raw)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                    sql_query = parsed.get("sql", "").strip()
                    chart_type = parsed.get("chart_type", None)
                except Exception:
                    sql_query, chart_type = raw, None
            else:
                sql_query, chart_type = raw, None

        sql_query = re.sub(r'```sql\n?', '', sql_query)
        sql_query = re.sub(r'```\n?', '', sql_query)
        sql_query = sql_query.strip()
        
        return sql_query, chart_type
   
    async def process_query(self, user_query: str) -> Dict[str, Any]:
        """Main method to process user queries"""
        try:
            query_type = self._classify_query(user_query)
            print(f"Query classified as: {query_type}")
            
            if query_type == "chart_query":
                return await self._handle_chart_query(user_query)
            elif query_type == "sql_query":
                return await self._handle_sql_query(user_query)
            elif query_type == "semantic_query":
                return await self._handle_semantic_query(user_query)
            else:
                return await self._handle_general_query(user_query)
                
        except Exception as e:
            print(f"Error processing query: {e}")
            return {
                "type": "text",
                "content": f"I encountered an error while processing your query: {str(e)}"
            }
    
    async def _handle_chart_query(self, query: str) -> Dict[str, Any]:
        """Handle queries that require charts"""
        try:
            sql_query, chart_type = self._generate_sql_query(query)
            print(f"Generated SQL for chart: {sql_query}, chart_type: {chart_type}")
            
            sql_result = self._execute_sql_query(sql_query)
            
            if "Error" in sql_result:
                return {
                    "type": "text",
                    "content": f"I couldn't generate the chart due to a database error: {sql_result}"
                }
            
            if chart_type:
                data = self._extract_sql_data(sql_result)
                if not data:
                    return {
                        "type": "text",
                        "content": f"I found data but couldn't create a chart:\n{sql_result}"
                    }

                chart_data = {
                    "chartType": chart_type,
                    "data": data,
                    "title": f"Visualization for: {query}"
                }

                summary_prompt = f"""
                Based on this SQL query result for the question "{query}":
                {sql_result}
                
                Provide a brief 1-2 sentence summary of the key insight.
                """
                
                summary_response = self.llm.invoke([HumanMessage(content=summary_prompt)])
                
                return {
                    "type": "chart",
                    "content": chart_data,
                    "summary": summary_response.content.strip()
                }
            
            return {
                "type": "text",
                "content": f"Here are the results:\n{sql_result}"
            }
                
        except Exception as e:
            return {
                "type": "text",
                "content": f"Error generating chart: {str(e)}"
            }

    async def _handle_sql_query(self, query: str) -> Dict[str, Any]:
        """Handle specific data queries using SQL"""
        try:
            sql_query, chart_type = self._generate_sql_query(query)
            print(f"Generated SQL: {sql_query}")
            
            sql_result = self._execute_sql_query(sql_query)
            
            if "Error" in sql_result:
                return {
                    "type": "text",
                    "content": f"I couldn't execute the query: {sql_result}"
                }
            
            response_prompt = f"""
            User asked: "{query}"
            
            SQL query executed: {sql_query}
            Results: {sql_result}
            
            Provide a clear, concise answer to the user's question based on these results.
            If the results are empty, say so. If there are specific numbers or data points, mention them clearly.
            """
            
            llm_response = self.llm.invoke([HumanMessage(content=response_prompt)])
            
            return {
                "type": "text",
                "content": llm_response.content.strip()
            }
            
        except Exception as e:
            return {
                "type": "text",
                "content": f"Error processing SQL query: {str(e)}"
            }

    async def _handle_semantic_query(self, query: str) -> Dict[str, Any]:
        """Handle semantic queries using vector search with snippets and full content"""
        try:
            search_results = self.semantic_search_tool._run(query)

            try:
                results_data = json.loads(search_results)
            except json.JSONDecodeError:
                results_data = []

            if not results_data:
                return {
                    "type": "text",
                    "content": "No relevant content found for your query."
                }

            analysis_prompt = f"""
            User asked: "{query}"
            
            Relevant content found (top {len(results_data)} matches):
            {json.dumps(results_data, indent=2)}
            
            Based on this content, provide a clear, comprehensive analysis answering the user's question.
            Highlight key insights, trends, opinions, or summaries from the posts/comments.
            """

            llm_response = self.llm.invoke([HumanMessage(content=analysis_prompt)])

            return {
                "type": "text",
                "content": llm_response.content.strip()
            }

        except Exception as e:
            return {
                "type": "text",
                "content": f"Error in semantic analysis: {str(e)}"
            }

    async def _handle_general_query(self, query: str) -> Dict[str, Any]:
        """Handle general queries directly with LLM"""
        try:
            response = self.llm.invoke([HumanMessage(content=query)])
            
            return {
                "type": "text",
                "content": response.content.strip()
            }
            
        except Exception as e:
            return {
                "type": "text",
                "content": f"Error processing general query: {str(e)}"
            }

def create_agent():
    """Factory function to create the agent"""
    return DataAnalysisAgent()