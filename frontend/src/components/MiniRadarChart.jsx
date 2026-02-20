import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const COLORS = {
  frontend: '#00d4ff',
  backend: '#7b2ff7',
  database: '#00e676',
  structure: '#ffd600',
  api: '#ff9100',
  integration: '#ff1744',
  security: '#e040fb',
};

/**
 * Mini radar chart for project cards on the dashboard.
 */
function MiniRadarChart({ metrics, size = 200 }) {
  const chartData = metrics.map((m) => ({
    dimension: capitalize(m.dimension),
    score: m.normalisedScore || 0,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width={size} height={size}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 10, fill: '#a0a0b8' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          dataKey="score"
          stroke="#00d4ff"
          fill="#00d4ff"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 8, fontSize: '0.8rem' }}
          formatter={(val) => [`${val.toFixed(1)}`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default MiniRadarChart;
export { COLORS };
