import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Zap, TrendingUp, Clock, Eye, MessageSquare, 
  Radio, Pause, Play, RefreshCw, Bell, Users 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const LiveMetric = ({ title, value, unit, icon, color, trend, isActive }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05 }}
    className={`p-6 rounded-2xl shadow-lg text-white relative overflow-hidden ${color}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-white/20 rounded-full relative">
        {icon}
        {isActive && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-white/30 rounded-full"
          />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {isActive && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-white rounded-full"
          />
        )}
        <span className="text-xs font-medium">LIVE</span>
      </div>
    </div>
    
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <div className="flex items-baseline gap-2 mb-2">
      <motion.span 
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-3xl font-bold"
      >
        {value}
      </motion.span>
      <span className="text-sm text-white/80">{unit}</span>
    </div>
    
    {trend && (
      <div className={`flex items-center gap-1 text-sm ${
        trend > 0 ? 'text-green-200' : 'text-red-200'
      }`}>
        <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
        <span>{Math.abs(trend)}% vs last hour</span>
      </div>
    )}
    
    {/* Pulse animation background */}
    <motion.div
      animate={{ 
        scale: [1, 1.5, 1],
        opacity: [0.1, 0.3, 0.1]
      }}
      transition={{ duration: 3, repeat: Infinity }}
      className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full"
    />
  </motion.div>
);

const ActivityFeedItem = ({ item, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      item.type === 'post' 
        ? 'bg-blue-100 text-blue-600' 
        : 'bg-green-100 text-green-600'
    }`}>
      {item.type === 'post' ? <MessageSquare className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </div>
    
    <div className="flex-1">
      <p className="font-medium text-slate-800">{item.action}</p>
      <p className="text-sm text-slate-600">{item.platform} • {item.time}</p>
    </div>
    
    <div className="text-right">
      <p className="text-sm font-medium text-slate-800">{item.metric}</p>
      <p className="text-xs text-slate-500">{item.metricType}</p>
    </div>
  </motion.div>
);

const HourlyActivityChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="hour" stroke="#64748b" />
      <YAxis stroke="#64748b" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px' 
        }} 
      />
      <Area 
        type="monotone" 
        dataKey="activity_count" 
        stroke="#6366f1" 
        fill="url(#activityGradient)"
        strokeWidth={3}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default function RealtimeFeed() {
  const [activityData, setActivityData] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 1247,
    postsPerHour: 89,
    commentsPerMinute: 23,
    engagementRate: 94.2
  });

  const [activityFeed] = useState([
    { action: "New high-engagement post", platform: "Reddit", time: "2 min ago", metric: "1.2K", metricType: "upvotes", type: "post" },
    { action: "Viral comment thread", platform: "YouTube", time: "5 min ago", metric: "856", metricType: "likes", type: "comment" },
    { action: "Trending discussion", platform: "Reddit", time: "8 min ago", metric: "2.1K", metricType: "views", type: "post" },
    { action: "Popular video comment", platform: "YouTube", time: "12 min ago", metric: "445", metricType: "likes", type: "comment" },
    { action: "Breaking news post", platform: "Reddit", time: "15 min ago", metric: "3.5K", metricType: "engagement", type: "post" }
  ]);

  const fetchActivityData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/realtime/activity`);
      const data = await response.json();
      setActivityData(data);
      console.log(data);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 20) - 10,
        postsPerHour: prev.postsPerHour + Math.floor(Math.random() * 6) - 3,
        commentsPerMinute: prev.commentsPerMinute + Math.floor(Math.random() * 4) - 2,
        engagementRate: Math.max(85, Math.min(98, prev.engagementRate + (Math.random() - 0.5) * 2))
      }));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="text-center">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
            >
              Real-time Feed
            </motion.h1>
            <p className="text-slate-600 mt-2">Connecting to live data stream...</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              Real-time Feed
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}
              />
            </h1>
            <p className="text-slate-600">Live activity monitoring and analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isLive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isLive ? 'Pause' : 'Resume'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Live Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <LiveMetric
          title="Active Users"
          value={liveMetrics.activeUsers.toLocaleString()}
          unit="online"
          icon={<Users className="h-6 w-6" />}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend={5.2}
          isActive={isLive}
        />
        <LiveMetric
          title="Posts per Hour"
          value={liveMetrics.postsPerHour}
          unit="posts"
          icon={<MessageSquare className="h-6 w-6" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={-2.1}
          isActive={isLive}
        />
        <LiveMetric
          title="Comments/Min"
          value={liveMetrics.commentsPerMinute}
          unit="comments"
          icon={<Activity className="h-6 w-6" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={8.7}
          isActive={isLive}
        />
        <LiveMetric
          title="Engagement Rate"
          value={liveMetrics.engagementRate.toFixed(1)}
          unit="%"
          icon={<Zap className="h-6 w-6" />}
          color="bg-gradient-to-br from-orange-500 to-red-500"
          trend={1.3}
          isActive={isLive}
        />
      </div>

      {/* Charts + Feed */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Radio className="h-6 w-6 text-emerald-500" />
              24-Hour Activity Pattern
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchActivityData}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-slate-600" />
            </motion.button>
          </div>
          <HourlyActivityChart data={activityData} />
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-500" />
            Live Activity Feed
          </h2>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {activityFeed.map((item, index) => (
                <ActivityFeedItem key={index} item={item} index={index} />
              ))}
            </AnimatePresence>
          </div>
          
          {/* Auto-refresh indicator */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
            >
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
                <span>Auto-refreshing live feed every few seconds</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
