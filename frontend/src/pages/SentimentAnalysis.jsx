import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Smile, Frown, Meh, TrendingUp, AlertTriangle, Users } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const SentimentCard = ({ sentiment, percentage, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -5 }}
    transition={{ duration: 0.3 }}
    className={`p-6 rounded-2xl shadow-lg ${color} text-white relative overflow-hidden`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-white/20 rounded-full">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm ${
        trend > 0 ? 'text-green-200' : 'text-red-200'
      }`}>
        <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
        <span>{Math.abs(trend)}%</span>
      </div>
    </div>
    
    <h3 className="text-lg font-semibold mb-2">{sentiment}</h3>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
      className="h-2 bg-white/30 rounded-full mb-2"
    >
      <div className="h-full bg-white rounded-full" />
    </motion.div>
    <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
    
    {/* Background decoration */}
    <motion.div
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.2, 0.1]
      }}
      transition={{ duration: 3, repeat: Infinity }}
      className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"
    />
  </motion.div>
);

const TrendChart = ({ data, title, dataKey, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
  >
    <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px' 
          }} 
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
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
      <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="space-y-8">
          <div className="text-center">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
            >
              Sentiment Analysis
            </motion.h1>
            <p className="text-slate-600 mt-2">Analyzing emotional patterns...</p>
          </div>
          
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
  const COLORS = ['#10b981', '#6b7280', '#ef4444'];

  return (
    <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Sentiment Analysis
        </h1>
        <p className="text-slate-600">Understanding emotional patterns across platforms</p>
      </motion.div>

      {/* Sentiment Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <SentimentCard
          sentiment="Positive"
          percentage={overallSentiment.positive || 0}
          icon={<Smile className="h-6 w-6" />}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          trend={5.2}
        />
        <SentimentCard
          sentiment="Neutral"
          percentage={overallSentiment.neutral || 0}
          icon={<Meh className="h-6 w-6" />}
          color="bg-gradient-to-br from-slate-500 to-slate-600"
          trend={-1.3}
        />
        <SentimentCard
          sentiment="Negative"
          percentage={overallSentiment.negative || 0}
          icon={<Frown className="h-6 w-6" />}
          color="bg-gradient-to-br from-red-500 to-red-600"
          trend={-2.1}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Sentiment Trends */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sentiment Trends (14 Days)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={sentimentData?.sentiment_trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Positive %"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="#6b7280" 
                strokeWidth={3}
                name="Neutral %"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Negative %"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Platform Comparison */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Platform Sentiment Comparison</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={sentimentData?.platform_sentiment} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="category" 
                stroke="#64748b"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px' 
                }} 
              />
              <Legend />
              <Bar dataKey="positive" fill="#10b981" name="Positive %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="neutral" fill="#6b7280" name="Neutral %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="negative" fill="#ef4444" name="Negative %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Sentiment Insights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Key Insights</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Most Positive Platform",
              value: "YouTube Posts",
              description: "Higher positive sentiment scores",
              icon: <Smile className="h-6 w-6 text-green-600" />,
              color: "from-green-50 to-emerald-50 border-green-200"
            },
            {
              title: "Engagement vs Sentiment",
              value: "Strong Correlation",
              description: "Positive content gets 2.3x more engagement",
              icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
              color: "from-blue-50 to-indigo-50 border-blue-200"
            },
            {
              title: "Risk Assessment",
              value: "Low Risk",
              description: "Toxicity levels are manageable",
              icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
              color: "from-orange-50 to-amber-50 border-orange-200"
            }
          ].map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className={`p-6 rounded-xl bg-gradient-to-br ${insight.color} border`}
            >
              <div className="flex items-center gap-3 mb-3">
                {insight.icon}
                <h3 className="font-semibold text-slate-800">{insight.title}</h3>
              </div>
              <p className="text-lg font-bold text-slate-900 mb-1">{insight.value}</p>
              <p className="text-sm text-slate-600">{insight.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}