import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, Zap, TrendingUp, Users, MessageSquare, 
  Radio, Pause, Play, RefreshCw, Bell, Eye 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Redesigned LiveMetric card for the light theme
const LiveMetric = ({ title, value, unit, icon, iconBg, trend, isActive }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${iconBg} w-max`}>
        {icon}
      </div>
      {isActive && (
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-100 rounded-full">
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            <span className="text-xs font-semibold text-emerald-800">LIVE</span>
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <div className="flex items-baseline gap-2">
      <motion.span 
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold text-slate-800"
      >
        {value}
      </motion.span>
      <span className="text-sm font-medium text-slate-500">{unit}</span>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-sm mt-1 ${
        trend > 0 ? 'text-emerald-600' : 'text-red-600'
      }`}>
        <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
        <span>{Math.abs(trend)}% vs last hour</span>
      </div>
    )}
  </motion.div>
);

// Redesigned ActivityFeedItem for the light theme
const ActivityFeedItem = ({ item, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ delay: index * 0.05 }}
    layout
    className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition-colors"
  >
    <div className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center ${
      item.type === 'post' 
        ? 'bg-indigo-100 text-indigo-600' 
        : 'bg-emerald-100 text-emerald-600'
    }`}>
      {item.type === 'post' ? <MessageSquare className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="font-medium text-slate-800 text-sm truncate">{item.action}</p>
      <p className="text-xs text-slate-500">{item.platform} • {item.time}</p>
    </div>
    
    <div className="text-right">
      <p className="text-sm font-semibold text-slate-800">{item.metric}</p>
      <p className="text-xs text-slate-500">{item.metricType}</p>
    </div>
  </motion.div>
);

// Generic AnimatedChart wrapper for consistency
const AnimatedChart = ({ title, icon, children, onRefresh, className = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 ${className}`}
    >
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                {icon}
                {title}
            </h2>
            {onRefresh && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onRefresh}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4 text-slate-600" />
                </motion.button>
            )}
        </div>
        {children}
    </motion.div>
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
  
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, action: "New high-engagement post", platform: "Reddit", time: "2 min ago", metric: "1.2K", metricType: "upvotes", type: "post" },
    { id: 2, action: "Viral comment thread", platform: "YouTube", time: "5 min ago", metric: "856", metricType: "likes", type: "comment" },
    { id: 3, action: "Trending discussion", platform: "Reddit", time: "8 min ago", metric: "2.1K", metricType: "views", type: "post" },
    { id: 4, action: "Popular video comment", platform: "YouTube", time: "12 min ago", metric: "445", metricType: "likes", type: "comment" },
    { id: 5, action: "Breaking news post", platform: "Reddit", time: "15 min ago", metric: "3.5K", metricType: "engagement", type: "post" }
  ]);

  const fetchActivityData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/realtime/activity`);
      const data = await response.json();
      setActivityData(data);
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
    
    const metricInterval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: Math.max(500, prev.activeUsers + Math.floor(Math.random() * 20) - 10),
        postsPerHour: Math.max(30, prev.postsPerHour + Math.floor(Math.random() * 6) - 3),
        commentsPerMinute: Math.max(10, prev.commentsPerMinute + Math.floor(Math.random() * 4) - 2),
        engagementRate: Math.max(85, Math.min(98, prev.engagementRate + (Math.random() - 0.5) * 0.5))
      }));
      setLastUpdate(new Date());
    }, 2000);

    const feedInterval = setInterval(() => {
        setActivityFeed(prevFeed => {
            const newItem = {
                id: Date.now(),
                action: "New user interaction detected",
                platform: Math.random() > 0.5 ? "Reddit" : "YouTube",
                time: "Just now",
                metric: Math.floor(Math.random() * 500) + 50,
                metricType: "engagement",
                type: Math.random() > 0.5 ? "post" : "comment"
            };
            return [newItem, ...prevFeed.slice(0, 4)];
        });
    }, 5000);

    return () => {
        clearInterval(metricInterval);
        clearInterval(feedInterval);
    };
  }, [isLive]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
            <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-8" />
            <div className="grid gap-6 md:grid-cols-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />)}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1 flex items-center gap-3">
                        Real-time Feed
                        <div className={`w-3 h-3 rounded-full transition-colors ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </h1>
                    <p className="text-slate-600">Live activity monitoring and analytics</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 hidden sm:block">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsLive(!isLive)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${ isLive ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-indigo-600 hover:bg-indigo-700 text-white' }`}>
                        {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isLive ? 'Pause' : 'Resume'}
                    </motion.button>
                </div>
            </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <LiveMetric title="Active Users" value={liveMetrics.activeUsers.toLocaleString()} unit="online" icon={<Users className="h-6 w-6 text-emerald-600" />} iconBg="bg-emerald-100" trend={5.2} isActive={isLive} />
          <LiveMetric title="Posts per Hour" value={liveMetrics.postsPerHour} unit="posts" icon={<MessageSquare className="h-6 w-6 text-indigo-600" />} iconBg="bg-indigo-100" trend={-2.1} isActive={isLive} />
          <LiveMetric title="Comments/Min" value={liveMetrics.commentsPerMinute} unit="comments" icon={<Activity className="h-6 w-6 text-purple-600" />} iconBg="bg-purple-100" trend={8.7} isActive={isLive} />
          <LiveMetric title="Engagement Rate" value={liveMetrics.engagementRate.toFixed(1)} unit="%" icon={<Zap className="h-6 w-6 text-amber-600" />} iconBg="bg-amber-100" trend={1.3} isActive={isLive} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <AnimatedChart title="24-Hour Activity Pattern" icon={<Radio className="h-6 w-6 text-indigo-500" />} onRefresh={fetchActivityData} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={activityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="activity_count" name="Activity" stroke="#6366f1" fill="url(#activityGradient)" strokeWidth={2.5} />
                </AreaChart>
            </ResponsiveContainer>
          </AnimatedChart>

          <AnimatedChart title="Live Activity Feed" icon={<Bell className="h-6 w-6 text-indigo-500" />}>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 -mr-4">
                <AnimatePresence>
                    {activityFeed.map((item, index) => (
                        <ActivityFeedItem key={item.id} item={item} index={index} />
                    ))}
                </AnimatePresence>
            </div>
            {isLive && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-3 text-sm text-emerald-800">
                        <RefreshCw className="h-4 w-4 animate-spin" style={{ animationDuration: '2s' }} />
                        <span>Feed is live and auto-refreshing.</span>
                    </div>
                </div>
            )}
          </AnimatedChart>
        </div>
      </div>
    </div>
  );
}
