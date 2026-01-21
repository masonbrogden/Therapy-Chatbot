import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './MoodChart.css';

export default function MoodChart({ entries }) {
  if (!entries || entries.length === 0) {
    return <p className="no-data">No mood data yet. Start tracking your mood!</p>;
  }

  // Prepare data for chart
  const chartData = entries.map((entry) => ({
    date: new Date(entry.entry_date || entry.created_at).toLocaleDateString(),
    mood: entry.mood_score,
  }));

  return (
    <div className="mood-chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[1, 10]} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="mood" 
            stroke="#3498db" 
            dot={{ fill: '#3498db' }}
            name="Mood Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
