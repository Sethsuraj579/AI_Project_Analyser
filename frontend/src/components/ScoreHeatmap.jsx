import React from 'react';

const DIMENSION_ORDER = ['frontend', 'backend', 'database', 'structure', 'api', 'integration', 'security'];

/**
 * Heatmap visual showing scores across dimensions.
 * Color intensity corresponds to score value (green = high, red = low).
 */
function ScoreHeatmap({ metrics, runs }) {
  // Current run heatmap cells
  const cells = DIMENSION_ORDER.map((dim) => {
    const m = metrics.find((mm) => mm.dimension === dim);
    return {
      dimension: dim,
      score: m?.normalisedScore || 0,
      grade: m?.grade || '-',
      rawValue: m?.rawValue || 0,
      unit: m?.unit || '',
    };
  });

  return (
    <div>
      {/* Main heatmap row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        gap: 4,
        marginBottom: 16,
      }}>
        {cells.map((cell) => {
          const bg = scoreToColor(cell.score);
          return (
            <div
              key={cell.dimension}
              style={{
                background: bg,
                borderRadius: 8,
                padding: '20px 12px',
                textAlign: 'center',
                transition: 'transform 0.2s',
                cursor: 'default',
              }}
              title={`${cell.dimension}: ${cell.score.toFixed(1)} (${cell.grade})`}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {cell.score.toFixed(0)}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>
                {cell.dimension}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {cell.rawValue}{cell.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Color legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Critical</span>
        <div style={{
          width: 200, height: 10, borderRadius: 5,
          background: 'linear-gradient(90deg, #ff1744, #ff9100, #ffd600, #00d4ff, #00e676)',
        }} />
        <span>Excellent</span>
      </div>
    </div>
  );
}

function scoreToColor(score) {
  if (score >= 85) return 'rgba(0, 230, 118, 0.7)';
  if (score >= 70) return 'rgba(0, 212, 255, 0.6)';
  if (score >= 55) return 'rgba(255, 214, 0, 0.55)';
  if (score >= 40) return 'rgba(255, 145, 0, 0.55)';
  return 'rgba(255, 23, 68, 0.6)';
}

export default ScoreHeatmap;
