import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

/**
 * Full-size radar chart for the project detail page.
 * Shows scores for all 7 dimensions with threshold reference areas.
 */
function DimensionRadarChart({ metrics }) {
  const chartData = metrics.map((m) => ({
    dimension: capitalize(m.dimension),
    score: m.normalisedScore || 0,
    weight: (m.weight * 100).toFixed(0),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData} outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: '#a0a0b8', fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: '#6b6b80' }}
        />
        {/* Good threshold reference */}
        <Radar
          name="Target (Good)"
          dataKey="fullMark"
          stroke="rgba(0,230,118,0.3)"
          fill="rgba(0,230,118,0.04)"
          strokeDasharray="4 4"
          data={chartData.map((d) => ({ ...d, fullMark: 80 }))}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#00d4ff"
          fill="url(#radarGradient)"
          fillOpacity={0.3}
          strokeWidth={2}
          dot={{ fill: '#00d4ff', r: 4 }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a2e',
            border: '1px solid #2a2a40',
            borderRadius: 8,
            fontSize: '0.85rem',
          }}
          formatter={(val, name) => [`${val.toFixed(1)}`, name]}
        />
        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#7b2ff7" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default DimensionRadarChart;
