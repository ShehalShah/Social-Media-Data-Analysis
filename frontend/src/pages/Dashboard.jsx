import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Eye, Heart,
  ArrowUpRight, ArrowDownRight, Activity, Zap
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const StatCard = ({ title, value, change, icon, color, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ duration: 0.3 }}
    className={`relative overflow-hidden p-6 rounded-2xl shadow-lg ${color} border border-white/20`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-3xl font-bold text-white mt-2"
        >
          {isLoading ? (
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
          ) : (
            value?.toLocaleString() || '0'
          )}
        </motion.p>
        {change && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${change > 0 ? 'text-green-200' : 'text-red-200'
            }`}>
            {change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div
        // animate={{ rotate: [0, 360] }}
        // transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="p-3 bg-white/20 rounded-full"
      >
        {icon}
      </div>
    </div>

    {/* Animated background elements */}
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 100, opacity: [0, 0.3, 0] }}
      transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
      className="absolute top-0 left-0 w-32 h-1 bg-white/30 rounded-full"
    />
  </motion.div>
);

const QuickInsightCard = ({ title, data, isLoading }) => {
  const [platform, setPlatform] = useState("reddit");

  // Decide if platform filter should apply
  const isTrendingKeywords = title?.toLowerCase().includes("trending");

  // Apply filtering only if not trending
  const filteredData = isTrendingKeywords
    ? data
    : data?.filter((item) =>
        platform === "reddit"
          ? item.keyword?.toLowerCase().includes("reddit")
          : item.keyword?.toLowerCase().includes("youtube")
      );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        
        {/* Show platform toggle only if NOT trending */}
        {!isTrendingKeywords && (
          <div className="flex space-x-2">
            {["reddit", "youtube"].map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1 text-sm rounded-lg border transition ${
                  platform === p
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredData?.slice(0, 5).map((item, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-sm text-slate-600 truncate flex-1">
                {item.keyword || item.title}
              </span>
              <span className="text-sm font-medium text-indigo-600 ml-2">
                {item.engagement_score?.toLocaleString() ||
                  item.count?.toLocaleString() ||
                  "N/A"}
              </span>
            </motion.div>
          )) || <p className="text-sm text-slate-500">No data available</p>}
        </div>
      )}
    </motion.div>
  );
};

const AnimatedChart = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    whileHover={{ scale: 1.01 }}
    className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 bg-indigo-500 rounded-full"
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
          analyticsRes.json(),
          trendsRes.json(),
          sentimentRes.json(),
          trendingRes.json()
        ]);

        console.group("📊 Analytics State Update");
        console.log("analyticsData:", analyticsData);
        console.log("trendsData:", trendsData);
        console.log("sentimentData:", sentimentData);
        console.log("trendingData:", trendingData);
        console.groupEnd();


        setAnalytics(analyticsData);
        setTrends(trendsData);
        setSentiment(sentimentData);
        setTrending(trendingData);
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
      <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="text-center">
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Dashboard
            </motion.h1>
            <p className="text-slate-600 mt-2">Loading your insights...</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-slate-600">Real-time insights from Reddit and YouTube data</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Posts"
          value={analytics?.total_posts}
          change={12}
          icon={<MessageSquare className="h-6 w-6 text-white" />}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Comments"
          value={analytics?.total_comments}
          change={8}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Avg Engagement"
          value={analytics?.engagement_stats?.average_engagement}
          change={-3}
          icon={<Heart className="h-6 w-6 text-white" />}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Views"
          value={analytics?.engagement_stats?.total_engagement}
          change={15}
          icon={<Eye className="h-6 w-6 text-white" />}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          isLoading={isLoading}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Activity Trends */}
        <AnimatedChart title="Activity Trends (Last 30 Days)">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="redditGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4500" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ff4500" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="youtubeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff0000" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ff0000" stopOpacity={0.1} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="reddit_posts"
                name="Reddit Posts"
                stackId="1"
                stroke="#ff4500"
                fill="url(#redditGradient)"
              />
              <Area
                type="monotone"
                dataKey="youtube_posts"
                name="YouTube Posts"
                stackId="1"
                stroke="#ff0000"
                fill="url(#youtubeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </AnimatedChart>

        {/* Sentiment Distribution */}
        <AnimatedChart title="Sentiment Distribution">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Positive",
                    value: sentiment?.platform_sentiment?.reduce((sum, d) => sum + d.positive, 0) || 0,
                    fill: "#10b981"
                  },
                  {
                    name: "Neutral",
                    value: sentiment?.platform_sentiment?.reduce((sum, d) => sum + d.neutral, 0) || 0,
                    fill: "#6b7280"
                  },
                  {
                    name: "Negative",
                    value: sentiment?.platform_sentiment?.reduce((sum, d) => sum + d.negative, 0) || 0,
                    fill: "#ef4444"
                  }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                paddingAngle={5}
                dataKey="value"
                label
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </AnimatedChart>

      </div>

      {/* Engagement and Platform Stats */}
      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        {/* Platform Breakdown */}
        <AnimatedChart title="Platform Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                {
                  platform: 'Reddit',
                  posts: analytics?.platforms?.reddit?.posts || 0,
                  comments: analytics?.platforms?.reddit?.comments || 0
                },
                {
                  platform: 'YouTube',
                  posts: analytics?.platforms?.youtube?.posts || 0,
                  comments: analytics?.platforms?.youtube?.comments || 0
                }
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="platform" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="posts" fill="#6366f1" name="Posts" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" fill="#8b5cf6" name="Comments" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnimatedChart>

        {/* Quick Insights */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          <QuickInsightCard
            title="Trending Keywords"
            data={trending}
            isLoading={isLoading}
          />
          <QuickInsightCard
            title="Top Performers"
            data={analytics?.top_keywords}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <AnimatedChart title="Real-time Activity Monitor" className="mb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Now", value: "1,234", icon: <Activity className="h-5 w-5" />, color: "text-green-600" },
            { label: "Hourly Posts", value: "89", icon: <TrendingUp className="h-5 w-5" />, color: "text-blue-600" },
            { label: "Comments/Min", value: "12", icon: <MessageSquare className="h-5 w-5" />, color: "text-purple-600" },
            { label: "Engagement Rate", value: "94%", icon: <Zap className="h-5 w-5" />, color: "text-orange-600" }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className={`p-2 rounded-lg bg-white ${metric.color}`}>
                {metric.icon}
              </div>
              <div>
                <p className="text-sm text-slate-600">{metric.label}</p>
                <p className="text-lg font-semibold text-slate-800">{metric.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trends?.slice(-7)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              dataKey="total_engagement"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </AnimatedChart>

      {/* Floating Action Insights */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="fixed bottom-6 right-6 z-10"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-2xl cursor-pointer"
          onClick={() => window.location.href = '/analyzer'}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-medium">Ask AI</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}