import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useApi } from '../hooks/useApi';
import { Loader } from '../components/Loader';
import { ErrorMessage } from '../components/ErrorMessage';

const StatCard = ({ title, value, color }) => (
  <div className={`p-6 rounded-xl shadow-lg ${color}`}>
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value ? value.toLocaleString() : '0'}</p>
  </div>
);

const TimeSeriesChart = () => {
  const { data, loading, error } = useApi('/api/timeseries');
  
  if (loading) return <div className="h-[300px] flex items-center justify-center"><Loader /></div>;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip wrapperStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
        <Legend />
        <Area type="monotone" dataKey="youtube_comments" name="YouTube" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
        <Area type="monotone" dataKey="reddit_comments" name="Reddit" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6}/>
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default function Dashboard() {
  const { data: summary, loading, error } = useApi('/api/summary');

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-6 bg-slate-50">
        <h1 className="text-3xl font-bold tracking-tight text-gray-300 animate-pulse">Dashboard</h1>
        <div className="h-full flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 pt-6 bg-slate-50">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <ErrorMessage message={error} />
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total YouTube Comments" value={summary?.total_youtube_comments} color="bg-red-200" />
        <StatCard title="Total Reddit Comments" value={summary?.total_reddit_comments} color="bg-orange-200" />
        <StatCard title="Total YouTube Posts" value={summary?.total_youtube_posts} color="bg-red-300" />
        <StatCard title="Total Reddit Posts" value={summary?.total_reddit_posts} color="bg-orange-300" />
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="text-lg font-semibold mb-2">Comment Activity Over Time</h2>
        <TimeSeriesChart />
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Top 5 Reddit Posts by Upvotes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.top_reddit_posts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="title" type="category" width={150} tickFormatter={(value) => String(value).slice(0, 20) + '...'} />
              <Tooltip wrapperStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <Bar dataKey="ups" fill="#ff8c00" name="Upvotes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Top 5 YouTube Posts by Views</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.top_youtube_posts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="title" type="category" width={150} tickFormatter={(value) => String(value).slice(0, 20) + '...'} />
              <Tooltip wrapperStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <Bar dataKey="views" fill="#ff0000" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}