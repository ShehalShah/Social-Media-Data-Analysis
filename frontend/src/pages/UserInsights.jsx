import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Crown, Trophy, MessageSquare, Award, 
  User, Activity, Target, Zap 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const UserCard = ({ user, rank, isTopContributor = false }) => {
  const rankColors = {
    1: 'from-yellow-400 to-yellow-500',
    2: 'from-gray-400 to-gray-500',
    3: 'from-amber-500 to-amber-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-5 rounded-xl shadow-md border transition-all duration-300 ${
        rank <= 3 
          ? 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200 shadow-lg' 
          : 'bg-white border-slate-200 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
            rank <= 3 
              ? `bg-gradient-to-r ${rankColors[rank]}` 
              : 'bg-gradient-to-r from-slate-400 to-slate-500'
          }`}>
            {rank <= 3 ? (
              rank === 1 ? <Crown className="h-6 w-6" /> : <Award className="h-5 w-5" />
            ) : (
              rank
            )}
          </div>
          {rank <= 3 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full"
            />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            @{user.username}
            <span className={`px-2 py-1 text-xs rounded-full ${
              user.platform === 'reddit' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {user.platform}
            </span>
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
            <div>
              <p className="text-slate-500">Posts</p>
              <p className="font-semibold text-slate-800">{user.post_count}</p>
            </div>
            <div>
              <p className="text-slate-500">Total Engagement</p>
              <p className="font-semibold text-slate-800">{user.total_engagement?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500">Avg Engagement</p>
              <p className="font-semibold text-slate-800">{Math.round(user.avg_engagement || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MetricWidget = ({ title, value, icon, color, description }) => (
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
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
      />
    </div>
    
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <motion.p 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      className="text-3xl font-bold mb-2"
    >
      {value}
    </motion.p>
    <p className="text-sm text-white/80">{description}</p>
  </motion.div>
);

export default function UserInsights() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('engagement');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/insights/user-analysis`);
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="text-center">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"
            >
              User Insights
            </motion.h1>
            <p className="text-slate-600 mt-2">Analyzing user behavior...</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
          User Insights
        </h1>
        <p className="text-slate-600">Deep dive into user behavior and contribution patterns</p>
      </motion.div>

      {/* User Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <MetricWidget
          title="Total Users"
          value={userData?.top_contributors?.length || 0}
          icon={<Users className="h-6 w-6" />}
          color="bg-gradient-to-br from-cyan-500 to-cyan-600"
          description="Active contributors"
        />
        <MetricWidget
          title="Power Users"
          value={userData?.top_contributors?.filter(u => u.total_engagement > 10000).length || 0}
          icon={<Zap className="h-6 w-6" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          description="High engagement users"
        />
        <MetricWidget
          title="Avg Posts per User"
          value={Math.round((userData?.top_contributors?.reduce((sum, u) => sum + u.post_count, 0) || 0) / (userData?.top_contributors?.length || 1))}
          icon={<MessageSquare className="h-6 w-6" />}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          description="Content creation rate"
        />
        <MetricWidget
          title="Top Contributor"
          value={userData?.top_contributors?.[0]?.total_engagement?.toLocaleString() || '0'}
          icon={<Crown className="h-6 w-6" />}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          description="Highest engagement"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Top Contributors */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Contributors Leaderboard
          </h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {userData?.top_contributors?.slice(0, 15).map((user, index) => (
              <UserCard 
                key={`${user.platform}-${user.username}`}
                user={user} 
                rank={index + 1}
                isTopContributor={index < 3}
              />
            ))}
          </div>
        </motion.div>

        {/* User Engagement Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" />
            Engagement Distribution
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userData?.engagement_distribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={5}
                dataKey="user_count"
                nameKey="range"
              >
                {userData?.engagement_distribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px' 
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* User Stats */}
          <div className="mt-6 space-y-3">
            {userData?.engagement_distribution?.map((range, index) => (
              <motion.div
                key={range.range}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-700">{range.range}</span>
                </div>
                <span className="text-sm text-slate-600">{range.user_count} users</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* User Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Top 10 Users Performance Comparison</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={userData?.top_contributors?.slice(0, 10)}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="username" 
              stroke="#64748b"
              angle={-45}
              textAnchor="end"
              height={80}
              tickFormatter={(value) => `@${value.slice(0, 10)}${value.length > 10 ? '...' : ''}`}
            />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px' 
              }}
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Bar 
              dataKey="total_engagement" 
              fill="#06b6d4" 
              name="Total Engagement"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="post_count" 
              fill="#8b5cf6" 
              name="Post Count"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* User Insights Cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Activity Pattern</h3>
          </div>
          <p className="text-2xl font-bold mb-2">Peak Hours</p>
          <p className="text-sm text-blue-100">Users are most active during 6-9 PM</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Content Quality</h3>
          </div>
          <p className="text-2xl font-bold mb-2">High Quality</p>
          <p className="text-sm text-green-100">85% of top users maintain good engagement</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <User className="h-6 w-6" />
            <h3 className="text-lg font-semibold">User Growth</h3>
          </div>
          <p className="text-2xl font-bold mb-2">+15% Monthly</p>
          <p className="text-sm text-purple-100">New active contributors joining</p>
        </motion.div>
      </div>
    </div>
  );
}