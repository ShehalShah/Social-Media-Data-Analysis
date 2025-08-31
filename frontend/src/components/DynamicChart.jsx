import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const transformChartData = (rawData) => {
    if (!rawData) return [];
    return rawData.map(item => {
      if (Array.isArray(item.value) && item.value.length === 2) {
        return {
          x: item.value[0],  // date or category
          y: item.value[1],  // number
        };
      }
      return item;
    });
  };
  

const getChartKeys = (data) => {
    if (!data || data.length === 0) return { xAxisKey: 'name', yAxisKey: 'value' };
    const keys = Object.keys(data[0]);
    const xAxisKey = keys.find(key => typeof data[0][key] === 'string') || keys[0];
    const yAxisKey = keys.find(key => typeof data[0][key] === 'number') || keys[1];
    return { xAxisKey, yAxisKey };
};

export default function DynamicChart({ chartData }) {
    console.log(chartData);

    const { chartType, data, title } = chartData;
    const transformedData = transformChartData(data);
    const { xAxisKey, yAxisKey } = getChartKeys(transformedData);

    console.log(transformedData);
    

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={transformedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxisKey} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={yAxisKey} stroke="#8884d8" />
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie data={data} dataKey={yAxisKey} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxisKey} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={yAxisKey} fill="#8884d8" />
                    </BarChart>
                );
        }
    };

    return (
        <div className="p-4 rounded-xl bg-white shadow-sm border">
            <h3 className="font-semibold text-center mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
}