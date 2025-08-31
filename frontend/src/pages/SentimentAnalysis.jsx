import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Smile, Frown, Meh, TrendingUp, AlertTriangle } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Redesigned SentimentCard for the light theme
const SentimentCard = ({ sentiment, percentage, icon, color, trend, iconBg }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    transition={{ duration: 0.3 }}
    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${
        trend > 0 ? 'text-emerald-500' : 'text-red-500'
      }`}>
        <TrendingUp className={`h-4 w-4 transition-transform ${trend < 0 ? 'rotate-180' : ''}`} />
        <span>{Math.abs(trend)}%</span>
      </div>
    </div>
    
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{sentiment}</h3>
    <p className="text-3xl font-bold text-slate-900 mb-3">{percentage.toFixed(1)}%</p>
    <div className="w-full bg-slate-200 rounded-full h-2.5">
        <motion.div
            className={`h-2.5 rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
        />
    </div>
  </motion.div>
);

// Generic AnimatedChart wrapper for consistency
const AnimatedChart = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className={`bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 ${className}`}
  >
    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2.5 h-2.5 bg-indigo-500 rounded-full"
      />
      {title}
    </h2>
    {children}
  </motion.div>
);

export default function SentimentAnalysis() {
  const [sentimentData, setSentimentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/sentiment/analysis`);
        const data = await response.json();
        console.log(data);
        
        setSentimentData(data);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-8" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overallSentiment = sentimentData?.platform_sentiment?.[0] || { positive: 0, negative: 0, neutral: 0 };
  
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">
            Sentiment Analysis
          </h1>
          <p className="text-slate-600">Understanding emotional patterns across platforms</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <SentimentCard
            sentiment="Positive"
            percentage={overallSentiment.positive || 0}
            icon={<Smile className="h-6 w-6 text-emerald-600" />}
            color="bg-emerald-500"
            iconBg="bg-emerald-100"
            trend={5.2}
          />
          <SentimentCard
            sentiment="Neutral"
            percentage={overallSentiment.neutral || 0}
            icon={<Meh className="h-6 w-6 text-slate-600" />}
            color="bg-slate-500"
            iconBg="bg-slate-200"
            trend={-1.3}
          />
          <SentimentCard
            sentiment="Negative"
            percentage={overallSentiment.negative || 0}
            icon={<Frown className="h-6 w-6 text-red-600" />}
            color="bg-red-500"
            iconBg="bg-red-100"
            trend={-2.1}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <AnimatedChart title="Sentiment Trends (14 Days)">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={sentimentData?.sentiment_trends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="positive" name="Positive %" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="neutral" name="Neutral %" stroke="#64748b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="negative" name="Negative %" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </AnimatedChart>

          <AnimatedChart title="Platform Sentiment Comparison">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={sentimentData?.platform_sentiment} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend />
                <Bar dataKey="positive" fill="#10b981" name="Positive %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="neutral" fill="#64748b" name="Neutral %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" fill="#ef4444" name="Negative %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChart>
        </div>

        <AnimatedChart title="Key Insights">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Most Positive Platform", value: "YouTube Posts", description: "Higher positive sentiment scores", icon: <Smile className="h-6 w-6 text-emerald-600" />, bgColor: "bg-emerald-50" },
              { title: "Engagement vs Sentiment", value: "Strong Correlation", description: "Positive content gets 2.3x more engagement", icon: <TrendingUp className="h-6 w-6 text-indigo-600" />, bgColor: "bg-indigo-50" },
              { title: "Risk Assessment", value: "Low Risk", description: "Toxicity levels are manageable", icon: <AlertTriangle className="h-6 w-6 text-amber-600" />, bgColor: "bg-amber-50" }
            ].map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.5, duration: 0.5 }}
                className={`p-5 rounded-xl ${insight.bgColor}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {insight.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800">{insight.title}</h3>
                </div>
                <p className="text-xl font-bold text-slate-900 mb-1">{insight.value}</p>
                <p className="text-sm text-slate-600">{insight.description}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedChart>
      </div>
    </div>
  );
}
