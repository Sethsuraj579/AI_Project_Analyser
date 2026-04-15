import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#00d4ff', '#7b2ff7', '#00e676', '#ffd600', '#ff9100', '#e040fb', '#ff1744'];

/**
 * Pie chart showing the weight distribution across dimensions.
 */
function WeightPieChart({ metrics, configs }) {
  const data = metrics.map((m, i) => ({
    name: capitalize(m.dimension),
    value: parseFloat((m.weight * 100).toFixed(1)),
    score: m.normalisedScore,
    grade: m.grade,
  }));

  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 14;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const anchor = x > cx ? 'start' : 'end';

    return (
      <text
        x={x}
        y={y}
        fill="#d7e4ff"
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize="10.5"
        fontWeight="600"
      >
        {`${name}: ${value}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart margin={{ top: 6, right: 60, bottom: 34, left: 72 }}>
        <Pie
          data={data}
          cx="48%"
          cy="44%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          label={renderLabel}
          labelLine={{ stroke: '#6b6b80', strokeWidth: 1 }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          wrapperStyle={{
            paddingTop: 10,
            fontSize: '0.8rem',
            color: '#a0a0b8',
          }}
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
            return [`Weight: ${val}% | Score: ${p.score?.toFixed(1)} | Grade: ${p.grade}`];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default WeightPieChart;
