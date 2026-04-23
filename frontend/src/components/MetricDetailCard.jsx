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

/**
 * Detailed card for a single dimension metric.
 * Shows raw value, score, grade, thresholds, and details.
 */
function MetricDetailCard({ metric, configs }) {
  const color = DIMENSION_COLORS[metric.dimension] || '#00d4ff';
  const score = metric.normalisedScore || 0;
  const config = configs.find((c) => c.dimension === metric.dimension);

  const details = parseDetails(metric.detailsJson);

  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h4 style={{ textTransform: 'capitalize', fontSize: '1rem', fontWeight: 600 }}>
            {metric.dimension}
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{metric.metricName}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className={`grade-badge grade-${metric.grade}`}>{metric.grade}</span>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Score</span>
          <span style={{ fontWeight: 700, color }}>{score.toFixed(1)} / 100</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: 4,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
        <StatItem label="Raw Value" value={`${metric.rawValue} ${metric.unit}`} />
        <StatItem label="Weight" value={`${(metric.weight * 100).toFixed(0)}%`} />
        <StatItem label="Good Threshold" value={metric.thresholdGood} color="#00e676" />
        <StatItem label="Warning Threshold" value={metric.thresholdWarning} color="#ffd600" />
        <StatItem label="Critical Threshold" value={metric.thresholdCritical} color="#ff1744" />
        {config && <StatItem label="Direction" value={config.higherIsBetter ? '↑ Higher is better' : '↓ Lower is better'} />}
      </div>

      {/* Details */}
      {Object.keys(details).length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            View raw details
          </summary>
          <pre style={{
            marginTop: 8, padding: 12, background: 'var(--bg-primary)',
            borderRadius: 8, fontSize: '0.7rem', color: 'var(--text-muted)',
            overflow: 'auto', maxHeight: 200,
          }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function parseDetails(detailsJson) {
  try {
    return JSON.parse(detailsJson || '{}');
  } catch {
    return {};
  }
}

function StatItem({ label, value, color }) {
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{label}</div>
      <div style={{ fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

export default MetricDetailCard;
