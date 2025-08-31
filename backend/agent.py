import os
from dotenv import load_dotenv

# Load environment variables at the very beginning of the script.
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain.agents import AgentExecutor, create_react_agent, Tool, initialize_agent
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities.sql_database import SQLDatabase
from langchain.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

# # --- Initialize Connections and Models ---
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# if not GEMINI_API_KEY:
#     raise ValueError("GEMINI_API_KEY not found in .env file.")

# SQL Database with sample rows for better context
db = SQLDatabase.from_uri(f"sqlite:///{os.getenv('SQL_DB_NAME', 'insights.db')}", sample_rows_in_table_info=3)

# Pinecone connection for Semantic Search
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
pinecone_index = pc.Index(os.getenv("PINECONE_INDEX_NAME", 'insights-index'))
embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

# The primary LLM for the agent, using Gemini 1.5 Flash's tool-calling capabilities
# llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, google_api_key=GEMINI_API_KEY)
llm = ChatGroq(
    model="llama3-8b-8192", # A very capable and fast model
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

# --- Define the Agent's Tools ---

# 1. Create the SQL Toolkit
sql_toolkit = SQLDatabaseToolkit(db=db, llm=llm)
sql_tools = sql_toolkit.get_tools() # This includes tools like sql_db_query, sql_db_schema, etc.

# 2. Create the Semantic Search Tool
semantic_search_tool = Tool(
    name="semantic_content_search",
    func=lambda query: pinecone_index.query(vector=embedding_model.encode(query).tolist(), top_k=3, include_metadata=True),
    description="Use this tool for vague, qualitative, or opinion-based questions. It searches the database content for semantic similarity."
)

# 3. Combine all tools for the agent
tools = sql_tools + [semantic_search_tool]

# --- The Master Prompt (The Agent's "Constitution") ---
# This is the most critical part. It gives the agent its identity and strict rules.
AGENT_PROMPT_TEMPLATE = """
You are a powerful and precise data analysis agent named Gemini Insights.
Your goal is to help users by providing clear, data-driven answers from a database of Reddit and YouTube data.

You have access to the following tools:
{tools}

The tool names you can call are:
{tool_names}

**Your Reasoning Process:**
1.  **Analyze the User's Query:** Understand if they want a specific fact (SQL), a general opinion (semantic search), or a visualization.
2.  **Select the Best Tool:** Choose the most appropriate tool from your list. For data questions, always use the SQL tools. For vague questions about "what people are saying," use semantic search.
3.  **Execute and Observe:** Run the tool and carefully observe the result. If a SQL query fails, check the schema and try to correct it once. If it fails again, apologize to the user.
4.  **Formulate the Final Answer:** Based on the tool's observation, construct your final response.

**CRITICAL INSTRUCTIONS for Final Answers:**

* **Standard Answers:** For most questions, provide a direct, text-based answer summarizing the findings from your tools.
* **Chart Generation:** If and only if the user's query **explicitly contains keywords like 'chart', 'graph', 'plot', 'visualize', or 'distribution'**, you must format your response in a specific way:
    1.  First, write a one-sentence summary of the insight.
    2.  Then, on a new line, wrap the raw, structured data you received from the `sql_db_query` tool inside `[CHART_DATA]` tags. The data should be a valid JSON array.

CRITICAL RULE: 
If a query produces a valid SQL result, that IS the final answer. 
Do not attempt another action. Immediately write your Final Answer AND STOP THINKING.

Use the following format for your thought process:
Question: the input question you must answer
Thought: your reasoning process for choosing a tool and forming the answer.
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer.
Final Answer: [Your final, formatted response here]

Begin!

Question: {input}
Thought: {agent_scratchpad}
"""

agent_prompt = PromptTemplate.from_template(AGENT_PROMPT_TEMPLATE)

# --- Create the Final Agent ---
# This combines the LLM, the tools, and the prompt into a single, powerful reasoning engine.
# agent = create_react_agent(llm=llm, tools=tools, prompt=agent_prompt)
# agent_executor = AgentExecutor(
#     agent=agent,
#     tools=tools,
#     verbose=True,
#     handle_parsing_errors="I'm sorry, I had trouble processing that request. Could you please rephrase it?",
#     max_iterations=3 # Add a safeguard against infinite loops
# )

agent_executor = initialize_agent(
    tools,
    llm,
    agent="zero-shot-react-description",
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=3
)

# import os
# from dotenv import load_dotenv

# # Load environment variables at the very beginning of the script.
# load_dotenv()

# from langchain_openai import ChatOpenAI
# from langchain.agents import AgentExecutor
# from langchain_community.agent_toolkits import create_sql_agent
# from langchain_community.utilities.sql_database import SQLDatabase
# from langchain.prompts import PromptTemplate
# from sentence_transformers import SentenceTransformer
# from pinecone import Pinecone
# from typing import Literal
# from pydantic import BaseModel, Field
# import google.generativeai as genai

# # --- Initialize Connections and Models ---

# # SQL Database with sample rows for better context for the SQL Agent
# db = SQLDatabase.from_uri(
#     f"sqlite:///{os.getenv('SQL_DB_NAME', 'insights.db')}",
#     sample_rows_in_table_info=3 
# )

# # Vector Database (Pinecone) connection for the Semantic Search Tool
# pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# pinecone_index = pc.Index(os.getenv("PINECONE_INDEX_NAME", 'insights-index'))
# embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

# # LLM for the main, powerful SQL agent
# llm = ChatOpenAI(
#     model="nousresearch/deephermes-3-llama-3-8b-preview:free",
#     openai_api_key=os.getenv("OPENROUTER_API_KEY"),
#     openai_api_base="https://openrouter.ai/api/v1",
#     temperature=0,
#     # model_kwargs={
#     #   "headers":{
#     #     "HTTP-Referer": "http://localhost", 
#     #     "X-Title": "SimPPL Insights"
#     #   }
#     # }
# )

# # --- 1. The Semantic Search Specialist Tool ---

# def semantic_search_tool(query: str) -> str:
#     """A standalone tool for performing semantic search on the vector database."""
#     try:
#         query_embedding = embedding_model.encode(query).tolist()
#         query_results = pinecone_index.query(vector=query_embedding, top_k=3, include_metadata=True)
#         results = [f"- \"{match['metadata']['text']}\" (from {match['metadata']['source']})" for match in query_results['matches']]
#         return "\n".join(results) if results else "No relevant information found for that topic."
#     except Exception as e:
#         return f"Error during search: {e}"


# # --- 2. The Router Agent ---
# class RouteQuery(BaseModel):
#     """Route a user query to the appropriate specialist."""
#     # FIX: Added detailed examples to the description to make the router more accurate.
#     route: Literal["sql", "vector_search", "general"] = Field(
#         ...,
#         description=(
#             "Classify the user's question to the appropriate tool. "
#             "Use 'sql' for any questions involving data analysis, counting, ranking, trends, or generating graphs (e.g., 'show me a graph of...', 'what is the distribution of...', 'count the number of...'). "
#             "Use 'vector_search' for vague, opinion-based, or qualitative questions (e.g., 'what do people think about...', 'find comments about...'). "
#             "Use 'general' for greetings or simple conversation (e.g., 'hello', 'thank you')."
#         )
#     )

# router_model = ChatOpenAI(
#     model="mistralai/mistral-small-3.2-24b-instruct:free",
#     openai_api_key=os.getenv("OPENROUTER_API_KEY"),
#     openai_api_base="https://openrouter.ai/api/v1",
#     temperature=0,
#     # model_kwargs={"headers":{"HTTP-Referer": "http://localhost", "X-Title": "SimPPL Insights"}}
# )
# router_chain = router_model.with_structured_output(RouteQuery)

# # --- SQL SPECIALIST AGENT ---

# # FIX: A new, complete prompt template that works with the 'zero-shot-react-description' agent type
# # and includes all required variables ({tools}, {tool_names}) and our custom instructions.
# SQL_AGENT_PROMPT_TEMPLATE = """
# You are a SQLite expert data analyst agent. You have access to a database and must answer the user's question.
# You have access to the following tools:
# {tools}

# Use the following format:
# Question: the input question you must answer
# Thought: You should always think about what to do. First, check the table names and schema to understand the data you have.
# Action: the action to take, should be one of [{tool_names}]
# Action Input: the input to the action
# Observation: the result of the action
# ... (this Thought/Action/Action Input/Observation can repeat N times)
# Thought: I now know the final answer.
# Final Answer: [The final answer to the original input question]

# ### YOUR INSTRUCTIONS ###
# 1.  Your primary goal is to answer the user's question by executing a single, efficient SQLite query.
# 2.  Use the table and sample row info to ensure your query is correct. **Never query for a column that does not exist.**
# 3.  **CRITICAL:** If a query's result is simple (like one row or one category), that IS the answer. Do not try another query. State the factual result.
# 4.  For queries asking for distributions, rankings, or data over time, the result is suitable for a chart. In your Final Answer, first write a one-sentence summary of the insight, then wrap the JSON data result in [CHART_DATA] tags.
# 5.  For all other queries, provide a clear, text-based final answer based on the query result.
# ### END INSTRUCTIONS ###

# Begin!
# Question: {input}
# Thought:{agent_scratchpad}
# """

# sql_agent_prompt = PromptTemplate.from_template(SQL_AGENT_PROMPT_TEMPLATE)

# # FIX: Switched to the 'zero-shot-react-description' agent type, which is compatible with your chosen model.
# # The custom prompt is now passed correctly.
# sql_agent_executor = create_sql_agent(
#     llm=llm,
#     db=db,
#     agent_type="zero-shot-react-description",
#     verbose=True,
#     prompt=sql_agent_prompt,
#     handle_parsing_errors="Check your output and make sure it conforms to the Action/Action Input format.",
# )

# # --- 4. NEW: The Chart Selector Brain ---
# # This chain decides which chart type is best for the given data.
# class ChartType(BaseModel):
#     """The type of chart to display."""
#     chart_type: Literal["bar", "line", "pie"] = Field(
#         ...,
#         description="Given a user question and the columns of the resulting data, choose the best chart type: 'bar' for rankings or counts, 'line' for time-series data, or 'pie' for distributions."
#     )

# chart_selector_prompt = PromptTemplate.from_template("""
# A user asked the following question: "{query}"
# The data analysis produced a table with these columns: {columns}

# Based on the user's question and the data columns, what is the best chart type to visualize this information?
# """)

# chart_selector_chain = router_model.with_structured_output(ChartType)
