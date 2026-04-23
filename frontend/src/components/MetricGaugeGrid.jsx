import React from 'react';

const DIMENSION_COLORS = {
  frontend: '#00d4ff',
  backend: '#7b2ff7',
  database: '#00e676',
  structure: '#ffd600',
  api: '#ff9100',
  integration: '#e040fb',
  security: '#ff1744',
};

const DIMENSION_ICONS = {
  frontend: '🖥️',
  backend: '⚙️',
  database: '🗄️',
  structure: '🏗️',
  api: '🔗',
  integration: '🔄',
  security: '🔒',
};

/**
 * Grid of circular gauge meters for each dimension metric.
 */
function MetricGaugeGrid({ metrics }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 16,
    }}>
      {metrics.map((m) => (
        <GaugeMeter key={m.dimension} metric={m} />
      ))}
    </div>
  );
}

function GaugeMeter({ metric }) {
  const score = metric.normalisedScore || 0;
  const color = DIMENSION_COLORS[metric.dimension] || '#00d4ff';
  const icon = DIMENSION_ICONS[metric.dimension] || '📊';

  // SVG arc gauge
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 196,
      padding: '16px 14px 14px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 12,
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', width: size, height: size / 2 + 30 }}>
        <svg width={size} height={size / 2 + 10} style={{ overflow: 'visible' }}>
          {/* Background arc */}
          <path
            d={describeArc(size / 2, size / 2, radius, 180, 360)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={describeArc(size / 2, size / 2, radius, 180, 180 + (score / 100) * 180)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'all 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          bottom: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22 }}>{icon}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color }}>{score.toFixed(0)}</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 4, width: '100%' }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.01em',
          lineHeight: 1.2,
          wordBreak: 'break-word',
        }}>
          {metric.dimension}
        </div>
        <div style={{
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          marginTop: 4,
          lineHeight: 1.25,
          wordBreak: 'break-word',
        }}>
          {formatRawValue(metric.rawValue)} {metric.unit} · {metric.grade}
        </div>
      </div>
    </div>
  );
}

function formatRawValue(value) {
  if (value == null || Number.isNaN(value)) return '0';
  return Number(value).toFixed(1).replace(/\.0$/, '');
}

// Helper to describe an SVG arc
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export default MetricGaugeGrid;
