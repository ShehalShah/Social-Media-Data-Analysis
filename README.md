# SimPPL Insights: AI-Powered Social Media Analysis Platform

This project is a full-stack web application designed to analyze and extract insights from large datasets of YouTube and Reddit comments and posts. It features a suite of analytical dashboards and a powerful conversational AI agent that can perform custom queries and generate visualizations on the fly.

**Live Demo:** [Link to your deployed application on Vercel/Render]

---

### Features

* **Intelligent Conversational Agent:** Ask complex, natural-language questions about the data. The agent can perform SQL queries, conduct semantic searches, and generate dynamic charts (bar, line, pie) to answer questions.
* **Comprehensive Analytics Dashboards:** Multiple pages of pre-computed analytics provide high-level insights into:
    * Overall Platform Activity & Trends
    * Sentiment Analysis
    * Engagement Metrics & Leaderboards
    * Toxicity Monitoring
    * User Behavior Insights
* **Robust Backend:** Built with FastAPI and a sophisticated, multi-step agent architecture using LangChain and a Large Language Model (e.g., Gemini/Groq).
* **Vector Search:** Utilizes Pinecone for powerful semantic search to find qualitative insights and opinions.
* **Modern Frontend:** A fully responsive, animated UI built with React, Vite, and Tailwind CSS, designed for an excellent user experience.

---

### Tech Stack

* **Backend:** Python, FastAPI, LangChain, SQLAlchemy, Pandas, Pinecone, Google Gemini / Groq
* **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Recharts
* **Database:** SQLite for structured data, Pinecone for vector embeddings.

---

### Setup & Installation

**1. Clone the repository:**
`git clone [your-repo-url]`

**2. Backend Setup:**
```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt ```

**3. Create .env file**
In the backend folder, create a .env file and add your API keys:
```
PINECONE_API_KEY="YOUR_KEY"
GEMINI_API_KEY="YOUR_KEY" # or GROQ_API_KEY, etc.
```
**4. Frontend Setup**
```
cd frontend
npm install
```

---
### Running the Application

**1. Run the Data Processing Script (First time only):**

```
cd backend
python process_data_pinecone.py
```

**2. Start the Backend Server: **
In one terminal:

```
cd backend
uvicorn app:app --reload
```

**3. Start the Frontend Server: **
In a second terminal:
```
cd frontend
npm run dev
```
The application will be available at http://localhost:5173.



