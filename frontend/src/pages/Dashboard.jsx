import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, MessageSquare, Heart, Eye,
  ArrowUpRight, ArrowDownRight, Activity, Zap
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const StatCard = ({ title, value, change, icon, iconColor, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    transition={{ duration: 0.3 }}
    className="relative bg-white p-6 rounded-2xl shadow-md border border-slate-200/80"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-3xl font-bold text-slate-800 mt-2"
        >
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          ) : (
            value?.toLocaleString() || '0'
          )}
        </motion.p>
        {change && (
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${iconColor}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const QuickInsightCard = ({ title, data, isLoading }) => {
  const [platform, setPlatform] = useState("reddit");
  const isTrendingKeywords = title?.toLowerCase().includes("trending");
  const filteredData = isTrendingKeywords ? data : data?.filter(item =>
    platform === "reddit" ? item.keyword?.toLowerCase().includes("reddit") : item.keyword?.toLowerCase().includes("youtube")
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {!isTrendingKeywords && (
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
            {["reddit", "youtube"].map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1 text-sm rounded-md transition font-medium ${platform === p ? "bg-white text-indigo-600 shadow-sm" : "bg-transparent text-slate-600 hover:bg-white/60"}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />)
        ) : (
          filteredData?.slice(0, 5).map((item, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-sm text-slate-700 truncate flex-1">{item.keyword || item.title}</span>
              <span className="text-sm font-semibold text-indigo-600 ml-2">{item.engagement_score?.toLocaleString() || item.count?.toLocaleString() || "N/A"}</span>
            </motion.div>
          )) || <p className="text-sm text-slate-500 text-center py-4">No data available</p>
        )}
      </div>
    </motion.div>
  );
};

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

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [trending, setTrending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [analyticsRes, trendsRes, sentimentRes, trendingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/overview`),
          fetch(`${API_BASE_URL}/api/trends/activity`),
          fetch(`${API_BASE_URL}/api/sentiment/analysis`),
          fetch(`${API_BASE_URL}/api/search/trending`)
        ]);
        const [analyticsData, trendsData, sentimentData, trendingData] = await Promise.all([
          analyticsRes.json(), trendsRes.json(), sentimentRes.json(), trendingRes.json()
        ]);
        setAnalytics(analyticsData); setTrends(trendsData); setSentiment(sentimentData); setTrending(trendingData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600">Real-time insights from Reddit and YouTube data</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="Total Posts" value={analytics?.total_posts} change={12} icon={<MessageSquare className="h-6 w-6 text-indigo-600" />} iconColor="bg-indigo-100" isLoading={isLoading} />
          <StatCard title="Total Comments" value={analytics?.total_comments} change={8} icon={<Users className="h-6 w-6 text-purple-600" />} iconColor="bg-purple-100" isLoading={isLoading} />
          <StatCard title="Avg Engagement" value={analytics?.engagement_stats?.average_engagement} change={-3} icon={<Heart className="h-6 w-6 text-pink-600" />} iconColor="bg-pink-100" isLoading={isLoading} />
          <StatCard title="Total Views" value={analytics?.engagement_stats?.total_engagement} change={15} icon={<Eye className="h-6 w-6 text-emerald-600" />} iconColor="bg-emerald-100" isLoading={isLoading} />
        </div>

        <div className="grid gap-8 lg:grid-cols-5 mb-8">
          <AnimatedChart title="Activity Trends (Last 30 Days)" className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="redditGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.7} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0.1} /></linearGradient>
                  <linearGradient id="youtubeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c084fc" stopOpacity={0.7} /><stop offset="95%" stopColor="#c084fc" stopOpacity={0.1} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="reddit_posts" name="Reddit Posts" stroke="#6366f1" fill="url(#redditGradient)" />
                <Area type="monotone" dataKey="youtube_posts" name="YouTube Posts" stroke="#a855f7" fill="url(#youtubeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </AnimatedChart>
          <AnimatedChart title="Sentiment Distribution" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={[{ name: "Positive", value: sentiment?.platform_sentiment?.reduce((s, d) => s + d.positive, 0) || 0, fill: "#10b981" }, { name: "Neutral", value: sentiment?.platform_sentiment?.reduce((s, d) => s + d.neutral, 0) || 0, fill: "#64748b" }, { name: "Negative", value: sentiment?.platform_sentiment?.reduce((s, d) => s + d.negative, 0) || 0, fill: "#ef4444" }]} cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={5} dataKey="value" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text>); }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedChart>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <AnimatedChart title="Platform Distribution" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{ platform: 'Reddit', posts: analytics?.platforms?.reddit?.posts || 0, comments: analytics?.platforms?.reddit?.comments || 0 }, { platform: 'YouTube', posts: analytics?.platforms?.youtube?.posts || 0, comments: analytics?.platforms?.youtube?.comments || 0 }]} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="platform" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend />
                <Bar dataKey="posts" fill="#6366f1" name="Posts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill="#a855f7" name="Comments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChart>
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <QuickInsightCard title="Trending Keywords" data={trending} isLoading={isLoading} />
            <QuickInsightCard title="Top Performers" data={analytics?.top_keywords} isLoading={isLoading} />
          </div>
        </div>
        
        <AnimatedChart title="Real-time Activity Monitor" className="mb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
                { label: "Active Now", value: "1,234", icon: <Activity className="h-5 w-5" />, color: "text-emerald-600", bgColor: "bg-emerald-100" },
                { label: "Hourly Posts", value: "89", icon: <TrendingUp className="h-5 w-5" />, color: "text-blue-600", bgColor: "bg-blue-100" },
                { label: "Comments/Min", value: "12", icon: <MessageSquare className="h-5 w-5" />, color: "text-purple-600", bgColor: "bg-purple-100" },
                { label: "Engagement Rate", value: "94%", icon: <Zap className="h-5 w-5" />, color: "text-orange-600", bgColor: "bg-orange-100" }
            ].map((metric, index) => (
                <motion.div
                key={metric.label}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                <div className={`p-3 rounded-lg ${metric.bgColor} ${metric.color}`}>
                    {metric.icon}
                </div>
                <div>
                    <p className="text-sm text-slate-500">{metric.label}</p>
                    <p className="text-lg font-semibold text-slate-800">{metric.value}</p>
                </div>
                </motion.div>
            ))}
            </div>

            <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends?.slice(-7)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="total_engagement" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
            </ResponsiveContainer>
        </AnimatedChart>

        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="fixed bottom-6 right-6 z-10"
        >
            <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/40"
            onClick={() => window.location.href = '/analyzer'}
            aria-label="Ask AI"
            >
                <Zap className="h-6 w-6" />
            </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

