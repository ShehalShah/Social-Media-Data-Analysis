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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UserCard = ({ user, rank }) => {
  const rankUI = {
    1: { icon: <Crown className="h-6 w-6 text-yellow-500" />, bgColor: 'bg-yellow-100' },
    2: { icon: <Trophy className="h-5 w-5 text-slate-500" />, bgColor: 'bg-slate-200' },
    3: { icon: <Award className="h-5 w-5 text-amber-600" />, bgColor: 'bg-amber-100' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ scale: 1.02, y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
      className="p-4 rounded-xl shadow-md border border-slate-200/80 bg-white transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${rankUI[rank]?.bgColor || 'bg-slate-100 text-slate-600'}`}>
            {rank <= 3 ? rankUI[rank].icon : rank}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 truncate">
            @{user.username}
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              user.platform === 'reddit' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {user.platform}
            </span>
          </h3>
          
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
              <span>Posts: <span className="font-semibold text-slate-700">{user.post_count}</span></span>
              <span>Engagement: <span className="font-semibold text-slate-700">{user.total_engagement?.toLocaleString()}</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MetricCard = ({ title, value, icon, iconBg, description }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80"
  >
    <div className={`p-3 rounded-xl ${iconBg} w-max mb-4`}>
        {icon}
    </div>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <motion.p 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
      className="text-3xl font-bold text-slate-800 my-1"
    >
      {value}
    </motion.p>
    <p className="text-sm text-slate-500">{description}</p>
  </motion.div>
);

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

export default function UserInsights() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];
  
  const userInsightCards = [
    { title: "Activity Pattern", value: "Peak Hours", description: "Users are most active during 6-9 PM", icon: <Activity className="h-6 w-6 text-indigo-600" />, iconBg: "bg-indigo-100" },
    { title: "Content Quality", value: "High Quality", description: "85% of top users maintain good engagement", icon: <Target className="h-6 w-6 text-emerald-600" />, iconBg: "bg-emerald-100" },
    { title: "User Growth", value: "+15% Monthly", description: "New active contributors joining", icon: <User className="h-6 w-6 text-purple-600" />, iconBg: "bg-purple-100" },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">User Insights</h1>
          <p className="text-slate-600">Deep dive into user behavior and contribution patterns</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard title="Total Users" value={userData?.top_contributors?.length || 0} icon={<Users className="h-6 w-6 text-cyan-600" />} iconBg="bg-cyan-100" description="Active contributors" />
          <MetricCard title="Power Users" value={userData?.top_contributors?.filter(u => u.total_engagement > 10000).length || 0} icon={<Zap className="h-6 w-6 text-purple-600" />} iconBg="bg-purple-100" description="High engagement" />
          <MetricCard title="Avg Posts per User" value={Math.round((userData?.top_contributors?.reduce((s, u) => s + u.post_count, 0) || 0) / (userData?.top_contributors?.length || 1))} icon={<MessageSquare className="h-6 w-6 text-emerald-600" />} iconBg="bg-emerald-100" description="Content creation rate" />
          <MetricCard title="Top Contributor" value={userData?.top_contributors?.[0]?.total_engagement?.toLocaleString() || '0'} icon={<Crown className="h-6 w-6 text-amber-600" />} iconBg="bg-amber-100" description="Highest engagement" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <AnimatedChart title="Top Contributors" className="lg:col-span-2">
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 -mr-2">
              {userData?.top_contributors?.slice(0, 15).map((user, index) => (
                <UserCard key={`${user.platform}-${user.username}`} user={user} rank={index + 1} />
              ))}
            </div>
          </AnimatedChart>

          <div className="flex flex-col gap-8">
            <AnimatedChart title="Engagement Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={userData?.engagement_distribution} cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={5} dataKey="user_count" nameKey="range">
                    {userData?.engagement_distribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{fontSize: "14px"}} />
                </PieChart>
              </ResponsiveContainer>
            </AnimatedChart>
            
            <AnimatedChart title="Platform Split">
                <ResponsiveContainer width="100%" height={230}>
                    <BarChart layout="vertical" data={[
                        { name: 'Reddit', count: userData?.top_contributors?.filter(u => u.platform === 'reddit').length || 0 },
                        { name: 'YouTube', count: userData?.top_contributors?.filter(u => u.platform === 'youtube').length || 0 }
                    ]} margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={14} width={70} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                        <Bar dataKey="count" name="User Count" radius={[0, 4, 4, 0]}>
                            <Cell fill="#ff5700" />
                            <Cell fill="#ff0000" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </AnimatedChart>
          </div>
        </div>

        <AnimatedChart title="Top 10 Users Performance" className="mt-8">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={userData?.top_contributors?.slice(0, 10)} margin={{ top: 20, right: 20, bottom: 80, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="username" stroke="#64748b" angle={-45} textAnchor="end" height={100} interval={0} tickFormatter={(v) => `@${v.slice(0, 10)}${v.length > 10 ? '...' : ''}`} fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend />
              <Bar dataKey="total_engagement" fill="#6366f1" name="Total Engagement" radius={[4, 4, 0, 0]} />
              <Bar dataKey="post_count" fill="#a855f7" name="Post Count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnimatedChart>
        
        <AnimatedChart title="Key User Insights" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userInsightCards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                        className={`p-5 rounded-xl ${card.iconBg}`}
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">{card.icon}</div>
                            <h3 className="font-semibold text-slate-800">{card.title}</h3>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mb-1">{card.value}</p>
                        <p className="text-sm text-slate-600">{card.description}</p>
                    </motion.div>
                ))}
            </div>
        </AnimatedChart>
      </div>
    </div>
  );
}

