import React, { useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
} from 'recharts';
import { Download } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

function normalizeData(raw) {
  // raw may be: array of objects, or array with `value` arrays like [x,y], or simple dicts
  if (!raw) return [];

  if (!Array.isArray(raw)) return [];

  // If first item has 'value' that's an array pair
  if (raw.length > 0 && Array.isArray(raw[0].value) && raw[0].value.length >= 2) {
    return raw.map((item) => ({ x: item.value[0], y: Number(item.value[1]) }));
  }

  // If items are plain objects
  const keys = Object.keys(raw[0] || {});
  // common pattern: {date: ..., num_comments: ...}
  if (keys.length >= 2) {
    // choose x as first string key, y as first numeric key
    const sample = raw[0];
    let xKey = keys.find((k) => typeof sample[k] === 'string') || keys[0];
    let yKey = keys.find((k) => typeof sample[k] === 'number') || keys.find((k) => !isNaN(Number(sample[k])));
    // fallback
    if (!yKey) yKey = keys[1];

    return raw.map((row) => ({ ...row, [xKey]: row[xKey], [yKey]: typeof row[yKey] === 'number' ? row[yKey] : Number(row[yKey]) }));
  }

  // fallback: return as-is
  return raw;
}

function getKeysFromData(data) {
  if (!data || data.length === 0) return { xKey: 'x', yKey: 'y' };
  const sample = data[0];
  const keys = Object.keys(sample);
  const xKey = keys.find((k) => typeof sample[k] === 'string') || keys[0];
  const yKey = keys.find((k) => typeof sample[k] === 'number') || keys[1] || keys[0];
  return { xKey, yKey };
}

export default function DynamicChart({ chartData }) {
  const downloadRef = useRef();
  const chartType = chartData?.chartType || 'bar';
  const raw = chartData?.data || [];
  const title = chartData?.title || '';

  const data = useMemo(() => normalizeData(raw), [raw]);
  const { xKey, yKey } = useMemo(() => getKeysFromData(data), [data]);

  const asCSV = () => {
    if (!data || data.length === 0) return '';
    const keys = Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map((r) => keys.map((k) => (`"${(r[k] ?? '').toString().replace(/"/g, '""')}"`)).join(','));
    return [header, ...rows].join('\n');
  };

  const downloadCSV = () => {
    const csv = asCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'chart').replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#8884d8" dot={false} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={yKey} stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey={xKey} name={xKey} />
            <YAxis dataKey={yKey} name={yKey} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill="#8884d8" />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#8884d8" />
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} barSize={20} />
            <Line dataKey={yKey} />
          </ComposedChart>
        );

      default:
        // fallback to bar
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#8884d8" />
          </BarChart>
        );
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <button onClick={downloadCSV} title="Download CSV" className="p-2 hover:bg-slate-100 rounded-md">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
