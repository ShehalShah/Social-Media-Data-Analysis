import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter 
} from 'recharts';
import { 
  Trophy, Crown, Star, TrendingUp, Eye, MessageSquare, 
  ThumbsUp, Filter, RefreshCw 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Redesigned LeaderboardCard for the light theme
const LeaderboardCard = ({ item, rank, platform }) => {
  const platformUI = {
    reddit: { iconColor: 'bg-orange-100 text-orange-600' },
    youtube: { iconColor: 'bg-red-100 text-red-600' }
  };

  const trophyIcons = {
    1: <Crown className="h-5 w-5 text-yellow-500" />,
    2: <Trophy className="h-5 w-5 text-slate-500" />,
    3: <Trophy className="h-5 w-5 text-amber-600" />
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ delay: rank * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className="bg-white rounded-xl p-4 shadow-md border border-slate-200/80 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full ${platformUI[platform]?.iconColor || ''} flex items-center justify-center font-bold text-sm`}>
            {rank <= 3 ? trophyIcons[rank] : rank}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate mb-1">{item.title}</h3>
          <p className="text-sm text-slate-500 mb-2">by @{item.username}</p>
          
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{item.views?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{item.engagement?.toLocaleString()}</span>
            </div>
            {item.comments && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{item.comments?.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Redesigned MetricCard for the light theme
const MetricCard = ({ title, value, subtitle, icon, iconBg, trend }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        {icon}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-sm font-medium text-emerald-500">
          <TrendingUp className="h-4 w-4" />
          <span>+{trend}%</span>
        </div>
      )}
    </div>
    
    <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
    <motion.p 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
      className="text-3xl font-bold text-slate-800 mb-1"
    >
      {value?.toLocaleString() || '0'}
    </motion.p>
    <p className="text-sm text-slate-500">{subtitle}</p>
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

export default function EngagementHub() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if(!refreshing) setIsLoading(true);
    try {
      const [leaderboardRes, popularRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/engagement/leaderboard`),
        fetch(`${API_BASE_URL}/api/content/popular`)
      ]);
      const [leaderboardData, popularData] = await Promise.all([leaderboardRes.json(), popularRes.json()]);
      setLeaderboardData({ ...leaderboardData, popular: popularData });
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getFilteredData = () => {
    if (!leaderboardData || !leaderboardData.top_posts) return [];
    const redditPosts = (leaderboardData.top_posts.reddit || []).map(p => ({...p, platform: 'reddit'}));
    const youtubePosts = (leaderboardData.top_posts.youtube || []).map(p => ({...p, platform: 'youtube'}));
    const allPosts = [...redditPosts, ...youtubePosts].sort((a, b) => b.engagement - a.engagement);
    if (selectedPlatform === 'all') return allPosts;
    return allPosts.filter(post => post.platform === selectedPlatform);
  };

  if (isLoading && !refreshing) {
    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-8" />
                <div className="grid gap-6 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        </div>
    );
  }
  
  const filteredData = getFilteredData();

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">Engagement Hub</h1>
              <p className="text-slate-600">Top performing content and engagement metrics</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50 shadow-sm">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <MetricCard title="Total Engagement" value={filteredData.reduce((s, i) => s + (i.engagement || 0), 0)} subtitle="Combined platforms" icon={<TrendingUp className="h-6 w-6 text-purple-600" />} iconBg="bg-purple-100" trend={12.5} />
          <MetricCard title="Avg Views per Post" value={Math.round(filteredData.reduce((s, i) => s + (i.views || 0), 0) / (filteredData.length || 1))} subtitle="Across all content" icon={<Eye className="h-6 w-6 text-indigo-600" />} iconBg="bg-indigo-100" trend={8.3} />
          <MetricCard title="Top Performers" value={filteredData.filter(i => i.engagement > 1000).length} subtitle="High engagement posts" icon={<Star className="h-6 w-6 text-amber-600" />} iconBg="bg-amber-100" trend={22.1} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <div className="flex items-center gap-4 bg-white rounded-xl p-3 shadow-md border border-slate-200/80">
            <Filter className="h-5 w-5 text-slate-500 ml-2" />
            <span className="text-sm font-medium text-slate-700">Filter by platform:</span>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              {['all', 'reddit', 'youtube'].map((platform) => (
                <button key={platform} onClick={() => setSelectedPlatform(platform)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedPlatform === platform ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-white/60'}`}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <AnimatedChart title="Top Performing Posts">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">
              <AnimatePresence>
                {filteredData.slice(0, 10).map((post, index) => (
                  <LeaderboardCard key={`${post.platform}-${index}`} item={post} rank={index + 1} platform={post.platform} />
                ))}
              </AnimatePresence>
            </div>
          </AnimatedChart>

          <AnimatedChart title="Most Liked Comments">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 -mr-2">
              {leaderboardData?.top_comments?.slice(0, 8).map((comment, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80">
                  <p className="text-sm text-slate-700 mb-3 line-clamp-3">{comment.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${comment.platform === 'reddit' ? 'bg-orange-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-slate-600 font-medium">@{comment.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{comment.likes?.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedChart>
        </div>

        <AnimatedChart title="Engagement vs Views Analysis" className="mt-8">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={filteredData.slice(0, 50)} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="views" name="Views" stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="number" dataKey="engagement" name="Engagement" stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 max-w-xs">
                      <p className="font-semibold text-slate-800 mb-2 truncate">{data.title}</p>
                      <p className="text-sm text-slate-600">Views: <span className="font-medium">{data.views?.toLocaleString()}</span></p>
                      <p className="text-sm text-slate-600">Engagement: <span className="font-medium">{data.engagement?.toLocaleString()}</span></p>
                      <p className="text-sm text-slate-600 capitalize">Platform: <span className="font-medium">{data.platform}</span></p>
                    </div>
                  );
                }
                return null;
              }} />
              <Scatter dataKey="engagement" fill="#8b5cf6" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </AnimatedChart>
      </div>
    </div>
  );
}
