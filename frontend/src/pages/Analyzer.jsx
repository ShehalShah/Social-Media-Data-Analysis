import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, CornerDownLeft } from 'lucide-react';
import DynamicChart from '../components/DynamicChart'; // Import the new component

const API_BASE_URL = 'http://127.0.0.1:8000';

const ChatMessage = ({ message }) => {
    const { type, content, summary, sender } = message;

    const renderContent = () => {
        switch (type) {
            case 'chart':
                return <DynamicChart chartData={content} />;
            case 'error':
                return <p className="text-red-500">{content}</p>;
            case 'text':
            default:
                return <p className="whitespace-pre-wrap">{content}</p>;
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
    { type: 'text', content: "Hello! You can ask me complex questions like 'Show me the top 5 most liked reddit comments' or 'What is the sentiment distribution on YouTube?'", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { type: 'text', content: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, { query: input });
      const botMessage = { ...response.data, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage = { type: 'error', content: "An error occurred. Please check the backend and try again.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
        <header className="p-4 border-b bg-white">
            <h1 className="text-xl font-semibold">Conversational Analyzer</h1>
            <p className="text-sm text-slate-500">Ask questions to generate dynamic insights and charts from the dataset.</p>
        </header>
      
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
            {isLoading && (
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"></div>
                    <div className="p-4 rounded-xl bg-white shadow-sm flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      
        <div className="p-4 border-t bg-white">
            <div className="relative">
                <textarea
                    ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                    className="w-full p-4 pr-20 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="e.g., Show me the top 5 most viewed YouTube posts"
                    rows={1} disabled={isLoading}
                />
                <button onClick={handleSend} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                    <CornerDownLeft className="h-4 w-4 hidden sm:inline" />
                </button>
            </div>
        </div>
    </div>
  );
}