import React from 'react';

/**
 * Circular gauge showing overall score + letter grade.
 */
function OverallScoreGauge({ score, grade, size = 80 }) {
  if (score == null) return null;

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color }}>{grade}</span>
        <span style={{ fontSize: size * 0.15, color: 'var(--text-muted)' }}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 85) return '#00e676';
  if (score >= 70) return '#00d4ff';
  if (score >= 55) return '#ffd600';
  if (score >= 40) return '#ff9100';
  return '#ff1744';
}

export default OverallScoreGauge;
