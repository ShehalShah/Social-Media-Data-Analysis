import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter 
} from 'recharts';
import { 
  Trophy, Crown, Star, TrendingUp, Eye, MessageSquare, 
  ThumbsUp, Filter, Search, RefreshCw 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const LeaderboardCard = ({ item, rank, platform }) => {
  const platformColors = {
    reddit: 'from-orange-500 to-red-500',
    youtube: 'from-red-500 to-red-600'
  };

  const trophyIcons = {
    1: <Crown className="h-5 w-5 text-yellow-400" />,
    2: <Trophy className="h-5 w-5 text-gray-400" />,
    3: <Trophy className="h-5 w-5 text-amber-600" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className="bg-white rounded-xl p-4 shadow-md border border-slate-200/50 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${platformColors[platform]} flex items-center justify-center text-white font-bold text-sm`}>
            {rank <= 3 ? trophyIcons[rank] : rank}
          </div>
          <span className="text-xs text-slate-500 mt-1 capitalize">{platform}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate mb-1">{item.title}</h3>
          <p className="text-sm text-slate-600 mb-2">by @{item.username}</p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{item.views?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{item.engagement?.toLocaleString()}</span>
            </div>
            {item.comments && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{item.comments?.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05 }}
    className={`p-6 rounded-2xl text-white relative overflow-hidden ${color}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-white/20 rounded-full">
        {icon}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>+{trend}%</span>
        </div>
      )}
    </div>
    
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <motion.p 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      className="text-3xl font-bold mb-1"
    >
      {value?.toLocaleString() || '0'}
    </motion.p>
    <p className="text-sm text-white/80">{subtitle}</p>
    
    {/* Floating elements */}
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full"
    />
  </motion.div>
);

export default function EngagementHub() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [leaderboardRes, popularRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/engagement/leaderboard`),
        fetch(`${API_BASE_URL}/api/content/popular`)
      ]);

      const [leaderboardData, popularData] = await Promise.all([
        leaderboardRes.json(),
        popularRes.json()
      ]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const getFilteredData = () => {
    if (!leaderboardData) return [];
    
    const allPosts = [
      ...(leaderboardData.top_posts?.reddit || []),
      ...(leaderboardData.top_posts?.youtube || [])
    ];
    
    if (selectedPlatform === 'all') return allPosts;
    return allPosts.filter(post => post.platform === selectedPlatform);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
        <div className="space-y-8">
          <div className="text-center">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Engagement Hub
            </motion.h1>
            <p className="text-slate-600 mt-2">Loading engagement metrics...</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Engagement Hub
            </h1>
            <p className="text-slate-600">Top performing content and engagement metrics</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Engagement Metrics */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <MetricCard
          title="Total Engagement"
          value={filteredData.reduce((sum, item) => sum + (item.engagement || 0), 0)}
          subtitle="Combined platforms"
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={12.5}
        />
        <MetricCard
          title="Avg Views per Post"
          value={Math.round(filteredData.reduce((sum, item) => sum + (item.views || 0), 0) / filteredData.length) || 0}
          subtitle="Across all content"
          icon={<Eye className="h-6 w-6" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={8.3}
        />
        <MetricCard
          title="Top Performers"
          value={filteredData.filter(item => item.engagement > 1000).length}
          subtitle="High engagement posts"
          icon={<Star className="h-6 w-6" />}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          trend={22.1}
        />
      </div>

      {/* Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-lg border border-slate-200/50">
          <Filter className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter by platform:</span>
          
          <div className="flex gap-2">
            {['all', 'reddit', 'youtube'].map((platform) => (
              <motion.button
                key={platform}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatform === platform
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top Posts Leaderboard */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Performing Posts
          </h2>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {filteredData.slice(0, 10).map((post, index) => (
                <LeaderboardCard 
                  key={`${post.platform}-${index}`}
                  item={post} 
                  rank={index + 1} 
                  platform={post.platform}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Top Comments */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-500" />
            Most Liked Comments
          </h2>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {leaderboardData?.top_comments?.slice(0, 8).map((comment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/50"
              >
                <p className="text-sm text-slate-700 mb-3 line-clamp-3">{comment.text}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      comment.platform === 'reddit' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-slate-600">@{comment.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{comment.likes?.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Engagement Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Engagement vs Views Analysis</h2>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart
            data={filteredData.slice(0, 50)}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="views" 
              name="Views"
              stroke="#64748b"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              type="number" 
              dataKey="engagement" 
              name="Engagement"
              stroke="#64748b"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                      <p className="font-semibold text-slate-800 mb-2">{data.title?.slice(0, 50)}...</p>
                      <p className="text-sm text-slate-600">Views: {data.views?.toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Engagement: {data.engagement?.toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Platform: {data.platform}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              dataKey="engagement" 
              fill="#8b5cf6"
              fillOpacity={0.7}
              stroke="#7c3aed"
              strokeWidth={2}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}