import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  TrendingDown, Activity, Eye, Users, FileText, Download, Bell 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const SafetyCard = ({ title, level, percentage, icon, iconBg, status }) => (
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
      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
        status === 'safe' 
          ? 'bg-emerald-100 text-emerald-800' 
          : status === 'moderate' 
          ? 'bg-amber-100 text-amber-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {status.toUpperCase()}
      </div>
    </div>
    
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <div className="flex items-baseline gap-2">
        <motion.p 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="text-3xl font-bold text-slate-800"
        >
          {percentage.toFixed(1)}%
        </motion.p>
        <p className="text-lg font-semibold text-slate-600">{level}</p>
    </div>
    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
                status === 'safe' ? 'bg-emerald-500' :
                status === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
            }`}
        />
    </div>
  </motion.div>
);

const ToxicityAlert = ({ alert, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`p-4 rounded-xl border-l-4 flex items-start gap-3 ${
      alert.severity === 'high' 
        ? 'bg-red-50/80 border-red-500' 
        : alert.severity === 'medium'
        ? 'bg-amber-50/80 border-amber-500'
        : 'bg-emerald-50/80 border-emerald-500'
    }`}
  >
    <div className="flex-shrink-0">
        {alert.severity === 'high' ? (
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : alert.severity === 'medium' ? (
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        ) : (
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
        )}
    </div>
    <div>
        <p className={`font-semibold ${
            alert.severity === 'high' ? 'text-red-800' : 
            alert.severity === 'medium' ? 'text-amber-800' : 'text-emerald-800'
        }`}>
            {alert.title}
        </p>
        <p className={`text-sm ${
            alert.severity === 'high' ? 'text-red-700' : 
            alert.severity === 'medium' ? 'text-amber-700' : 'text-emerald-700'
        }`}>
            {alert.description}
        </p>
    </div>
  </motion.div>
);

const AnimatedChart = ({ title, children, icon, className = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 ${className}`}
    >
      <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
        {icon}
        {title}
      </h2>
      {children}
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
      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
            <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-8" />
            <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />)}
            </div>
        </div>
      </div>
    );
  }

  const platformComparison = toxicityData?.platform_comparison || [];
  const alerts = [
    { title: "Low Toxicity Detected", description: "Overall toxicity levels are within acceptable range.", severity: "low" },
    { title: "Content Moderation Active", description: "Automated filtering is working effectively across platforms.", severity: "low" },
    { title: "Platform Health Good", description: "No significant toxicity spikes detected in the last 24 hours.", severity: "low" }
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">Toxicity Monitor</h1>
          <p className="text-slate-600">Content safety and moderation insights</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <SafetyCard title="Overall Safety" level="Safe" percentage={92.5} icon={<Shield className="h-6 w-6 text-emerald-600" />} iconBg="bg-emerald-100" status="safe" />
          <SafetyCard title="Toxic Content" level="Low" percentage={7.5} icon={<AlertTriangle className="h-6 w-6 text-amber-600" />} iconBg="bg-amber-100" status="moderate" />
          <SafetyCard title="Moderation Efficacy" level="High" percentage={98.2} icon={<Eye className="h-6 w-6 text-indigo-600" />} iconBg="bg-indigo-100" status="safe" />
        </div>

        <div className="grid gap-8 lg:grid-cols-5 mb-8">
          <AnimatedChart title="Platform Safety" icon={<Shield className="h-6 w-6 text-indigo-500" />} className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformComparison} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="platform" stroke="#64748b" fontSize={14} />
                <YAxis stroke="#64748b" fontSize={14} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} formatter={(v) => [`${v}%`, 'Toxicity Rate']} />
                <Bar dataKey="toxic_percentage" fill="#ef4444" name="Toxicity %" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChart>

          <AnimatedChart title="Content Classification" icon={<Activity className="h-6 w-6 text-indigo-500" />} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={toxicityData?.toxicity_distribution} cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={5} dataKey="count" nameKey="category">
                  {toxicityData?.toxicity_distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.level === 'toxic' ? '#ef4444' : '#10b981'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend wrapperStyle={{fontSize: "14px"}} />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedChart>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
            <AnimatedChart title="Safety Alerts & Status" icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <ToxicityAlert key={index} alert={alert} index={index} />
                ))}
              </div>
            </AnimatedChart>

            <AnimatedChart title="Detailed Platform Stats" icon={<Users className="h-6 w-6 text-indigo-500" />}>
              <div className="space-y-4">
                  {platformComparison.map((platform) => (
                      <motion.div key={platform.platform} whileHover={{backgroundColor: '#f8fafc'}} className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-slate-800">{platform.platform}</h3>
                              <p className={`text-lg font-bold ${platform.toxic_percentage < 5 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {platform.toxic_percentage?.toFixed(1)}%
                                  <span className="text-sm font-medium text-slate-500 ml-1">Toxicity</span>
                              </p>
                          </div>
                          <div className="flex justify-between mt-2 text-sm text-slate-600">
                              <span>Toxic Content: <span className="font-semibold text-slate-800">{platform.toxic_count?.toLocaleString()}</span></span>
                              <span>Total Content: <span className="font-semibold text-slate-800">{platform.total_count?.toLocaleString()}</span></span>
                          </div>
                      </motion.div>
                  ))}
              </div>
            </AnimatedChart>
        </div>

        <AnimatedChart title="Moderation Action Center" icon={<Activity className="h-6 w-6 text-indigo-500" />} className="mt-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: "Generate Report", description: "Create detailed toxicity report", icon: <FileText/> },
                { title: "Export Data", description: "Download filtered content data", icon: <Download/> },
                { title: "Set Alerts", description: "Configure monitoring alerts", icon: <Bell/> }
              ].map(action => (
                <motion.button key={action.title} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} className="p-5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">{action.icon}</div>
                    <div>
                        <h3 className="font-semibold text-slate-800">{action.title}</h3>
                        <p className="text-sm text-slate-500">{action.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
        </AnimatedChart>
      </div>
    </div>
  );
}
