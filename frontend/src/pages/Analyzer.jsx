import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, CornerDownLeft, RefreshCw, Download } from 'lucide-react';
import DynamicChart from '../components/DynamicChart';
import SuggestedQuestions from '../components/SuggestedQuestions';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ChatMessage = ({ message }) => {
  const { type, content, summary, sender } = message;

  console.log(content);
  

  const renderContent = () => {
    switch (type) {
      case 'chart':
        return <DynamicChart chartData={content} />;
      case 'error':
        return <p className="text-red-500">{content}</p>;
      case 'text':
      default:
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        );
    }
  };  

  return (
    <div className={`flex items-start gap-4 ${sender === 'user' ? 'justify-end' : ''}`}>
      {sender === 'bot' && <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"></div>}
      <div className={`p-4 rounded-xl max-w-2xl shadow-sm ${sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
        {summary && <p className="font-semibold mb-2 text-sm">{summary}</p>}
        {renderContent()}
      </div>
    </div>
  );
};

export default function Analyzer() {
  const [messages, setMessages] = useState([
    {
      type: 'text',
      content:
        "Hello! Try questions like: 'Visualize the number of reddit comments posted each day over time' or click a suggested question below.",
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const suggested = [
    'Visualize the number of reddit comments posted each day over time',
    'Show top 5 most liked reddit comments',
    'What is the sentiment distribution for YouTube comments?',
    'Top 10 posts by views in the last 30 days',
    'Summarize the general opinion on AI',
  ];  

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isLoading]);

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const handleSend = async (prefilled) => {
    const text = prefilled ?? input;
    if (!text.trim() || isLoading) return;

    const userMessage = { type: 'text', content: text, sender: 'user' };
    pushMessage(userMessage);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, { query: text }, { timeout: 60000 });
      const botMessage = { ...response.data, sender: 'bot' };
      pushMessage(botMessage);
    } catch (err) {
      console.error('Error fetching chat response:', err);
      setError(err?.response?.data || err.message || 'Unknown error');
      const errorMessage = { type: 'error', content: 'An error occurred. Check backend and try again.', sender: 'bot' };
      pushMessage(errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestedClick = (q) => handleSend(q);

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <header className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Conversational Analyzer</h1>
            <p className="text-sm text-slate-500">Generate insights & visualizations from your data — ask naturally.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} title="Reload" className="p-2 rounded-md hover:bg-slate-100">
              <RefreshCw />
            </button>
            <button onClick={clearChat} title="Clear chat" className="p-2 rounded-md hover:bg-slate-100">
              Clear
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <SuggestedQuestions suggestions={suggested} onClick={handleSuggestedClick} />

        {messages.length === 0 && (
          <div className="text-center text-slate-500">No messages yet — try a suggested question or ask your own.</div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
            <div className="p-4 rounded-xl bg-white shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        {error && <div className="mb-2 text-sm text-red-600">{String(error)}</div>}

        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full p-4 pr-28 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition min-h-[44px]"
            placeholder="Ask something like: Show comments per day"
            rows={1}
            disabled={isLoading}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => handleSend()}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading || !input.trim()}
              title="Send"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}