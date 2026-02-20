import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
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

const ALL_DIMENSIONS = ['frontend', 'backend', 'database', 'structure', 'api', 'integration', 'security'];

/**
 * Trend line chart showing historical metric scores over time.
 * Toggleable per-dimension.
 */
function TrendLineChart({ trends }) {
  const [activeDimensions, setActiveDimensions] = useState(new Set(ALL_DIMENSIONS));

  // Group trends by recordedAt timestamp, creating one data point per timestamp
  const grouped = {};
  trends.forEach((t) => {
    const key = t.recordedAt;
    if (!grouped[key]) grouped[key] = { time: key };
    grouped[key][t.dimension] = t.score;
  });

  const chartData = Object.values(grouped)
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .map((d, i) => ({
      ...d,
      label: `Run ${i + 1}`,
      time: new Date(d.time).toLocaleString(),
    }));

  const toggleDimension = (dim) => {
    setActiveDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  };

  if (chartData.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Run multiple analyses to see trends.</p>;
  }

  return (
    <div>
      {/* Dimension toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {ALL_DIMENSIONS.map((dim) => (
          <button
            key={dim}
            onClick={() => toggleDimension(dim)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: `2px solid ${DIMENSION_COLORS[dim]}`,
              background: activeDimensions.has(dim) ? DIMENSION_COLORS[dim] + '22' : 'transparent',
              color: activeDimensions.has(dim) ? DIMENSION_COLORS[dim] : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              fontFamily: 'var(--font)',
              transition: 'all 0.2s',
            }}
          >
            {dim}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a0a0b8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#a0a0b8' }} />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #2a2a40',
              borderRadius: 8,
              fontSize: '0.85rem',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
          {ALL_DIMENSIONS.filter((d) => activeDimensions.has(d)).map((dim) => (
            <Line
              key={dim}
              type="monotone"
              dataKey={dim}
              name={capitalize(dim)}
              stroke={DIMENSION_COLORS[dim]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default TrendLineChart;
