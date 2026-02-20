import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend,
} from 'recharts';

const DIMENSION_COLORS = {
  frontend: '#00d4ff',
  backend: '#7b2ff7',
  database: '#00e676',
  structure: '#ffd600',
  api: '#ff9100',
  integration: '#e040fb',
  security: '#ff1744',
};

/**
 * Horizontal bar chart comparing normalised scores across dimensions.
 * Includes reference lines for threshold levels.
 */
function DimensionBarChart({ metrics }) {
  const chartData = metrics.map((m) => ({
    name: capitalize(m.dimension),
    dimension: m.dimension,
    score: m.normalisedScore || 0,
    rawValue: m.rawValue,
    unit: m.unit,
    grade: m.grade,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#a0a0b8' }} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 11, fill: '#a0a0b8' }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a2e',
            border: '1px solid #2a2a40',
            borderRadius: 8,
            fontSize: '0.85rem',
          }}
          formatter={(val, name, props) => {
            const p = props.payload;
            return [`Score: ${val.toFixed(1)} | Raw: ${p.rawValue}${p.unit} | Grade: ${p.grade}`];
          }}
        />
        <ReferenceLine x={80} stroke="rgba(0,230,118,0.4)" strokeDasharray="4 4" label={{ value: 'Good', fill: '#6b6b80', fontSize: 10 }} />
        <ReferenceLine x={50} stroke="rgba(255,214,0,0.4)" strokeDasharray="4 4" label={{ value: 'Warn', fill: '#6b6b80', fontSize: 10 }} />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={DIMENSION_COLORS[entry.dimension] || '#00d4ff'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default DimensionBarChart;
