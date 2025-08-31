import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar 
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  TrendingDown, Activity, Eye, Users 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const SafetyCard = ({ title, level, percentage, icon, color, status }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -5 }}
    transition={{ duration: 0.3 }}
    className={`p-6 rounded-2xl shadow-lg text-white relative overflow-hidden ${color}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-white/20 rounded-full">
        {icon}
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        status === 'safe' 
          ? 'bg-green-500/20 text-green-100' 
          : status === 'moderate' 
          ? 'bg-yellow-500/20 text-yellow-100'
          : 'bg-red-500/20 text-red-100'
      }`}>
        {status.toUpperCase()}
      </div>
    </div>
    
    <h3 className="text-lg font-semibold mb-3">{title}</h3>
    
    {/* Progress Ring */}
    <div className="flex items-center gap-4 mb-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: percentage / 100 }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray={`${percentage} ${100 - percentage}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      
      <div>
        <p className="text-xl font-bold">{level}</p>
        <p className="text-sm text-white/80">Risk Level</p>
      </div>
    </div>
    
    {/* Background decoration */}
    <motion.div
      animate={{ 
        scale: [1, 1.3, 1],
        rotate: [0, 180, 360]
      }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full"
    />
  </motion.div>
);

const ToxicityAlert = ({ alert, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className={`p-4 rounded-xl border-l-4 ${
      alert.severity === 'high' 
        ? 'bg-red-50 border-red-500' 
        : alert.severity === 'medium'
        ? 'bg-yellow-50 border-yellow-500'
        : 'bg-green-50 border-green-500'
    }`}
  >
    <div className="flex items-center gap-3 mb-2">
      {alert.severity === 'high' ? (
        <XCircle className="h-5 w-5 text-red-600" />
      ) : alert.severity === 'medium' ? (
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
      ) : (
        <CheckCircle className="h-5 w-5 text-green-600" />
      )}
      <span className={`text-sm font-medium ${
        alert.severity === 'high' ? 'text-red-800' : 
        alert.severity === 'medium' ? 'text-yellow-800' : 'text-green-800'
      }`}>
        {alert.title}
      </span>
    </div>
    <p className={`text-sm ${
      alert.severity === 'high' ? 'text-red-700' : 
      alert.severity === 'medium' ? 'text-yellow-700' : 'text-green-700'
    }`}>
      {alert.description}
    </p>
  </motion.div>
);

export default function ToxicityMonitor() {
  const [toxicityData, setToxicityData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToxicityData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/insights/toxicity`);
        const data = await response.json();
        
        setToxicityData(data);
      } catch (error) {
        console.error('Error fetching toxicity data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToxicityData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="text-center">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"
            >
              Toxicity Monitor
            </motion.h1>
            <p className="text-slate-600 mt-2">Analyzing content safety...</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const platformComparison = toxicityData?.platform_comparison || [];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Mock alerts for demonstration
  const alerts = [
    {
      title: "Low Toxicity Detected",
      description: "Overall toxicity levels are within acceptable range",
      severity: "low"
    },
    {
      title: "Content Moderation Active",
      description: "Automated filtering is working effectively",
      severity: "low"
    },
    {
      title: "Platform Health Good",
      description: "No significant toxicity spikes detected",
      severity: "low"
    }
  ];

  return (
    <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Toxicity Monitor
        </h1>
        <p className="text-slate-600">Content safety and moderation insights</p>
      </motion.div>

      {/* Safety Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <SafetyCard
          title="Overall Safety"
          level="Safe"
          percentage={92.5}
          icon={<Shield className="h-6 w-6" />}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          status="safe"
        />
        <SafetyCard
          title="Toxic Content"
          level="Low"
          percentage={7.5}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="bg-gradient-to-br from-yellow-500 to-orange-500"
          status="moderate"
        />
        <SafetyCard
          title="Moderation"
          level="Active"
          percentage={98.2}
          icon={<Eye className="h-6 w-6" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          status="safe"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Platform Toxicity Comparison */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Platform Safety Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="platform" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px' 
                }} 
                formatter={(value, name) => [`${value}%`, 'Toxicity Rate']}
              />
              <Bar 
                dataKey="toxic_percentage" 
                fill="#ef4444" 
                name="Toxicity %"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Toxicity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Content Classification</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={toxicityData?.toxicity_distribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={5}
                dataKey="count"
                nameKey="category"
              >
                {toxicityData?.toxicity_distribution?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.level === 'toxic' ? '#ef4444' : '#10b981'} 
                  />
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
        </motion.div>
      </div>

      {/* Safety Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50 mb-8"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          Safety Alerts & Status
        </h2>
        
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <ToxicityAlert key={index} alert={alert} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Detailed Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platformComparison.map((platform, index) => (
          <motion.div
            key={platform.platform}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                platform.platform === 'Reddit' 
                  ? 'bg-orange-100 text-orange-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-800">{platform.platform}</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Toxicity Rate</p>
                <p className={`text-lg font-bold ${
                  platform.toxic_percentage < 5 ? 'text-green-600' : 
                  platform.toxic_percentage < 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {platform.toxic_percentage?.toFixed(1)}%
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600">Toxic Content</p>
                <p className="text-lg font-bold text-slate-800">{platform.toxic_count?.toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600">Total Content</p>
                <p className="text-lg font-bold text-slate-800">{platform.total_count?.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Center */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl"
      >
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Moderation Action Center
        </h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left"
          >
            <h3 className="font-semibold mb-2">Generate Report</h3>
            <p className="text-sm text-slate-300">Create detailed toxicity report</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left"
          >
            <h3 className="font-semibold mb-2">Export Data</h3>
            <p className="text-sm text-slate-300">Download filtered content data</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left"
          >
            <h3 className="font-semibold mb-2">Set Alerts</h3>
            <p className="text-sm text-slate-300">Configure monitoring alerts</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}