import React from 'react';

const DIMENSION_ORDER = ['frontend', 'backend', 'database', 'structure', 'api', 'integration', 'security'];

/**
 * Heatmap visual showing scores across dimensions.
 * Color intensity corresponds to score value (green = high, red = low).
 */
function ScoreHeatmap({ metrics, runs }) {
  const metricByDimension = new Map(
    metrics.map((metric) => [normalizeDimension(metric?.dimension), metric])
  );

  // Current run heatmap cells
  const cells = DIMENSION_ORDER.map((dim) => {
    const m = metricByDimension.get(dim);
    const numericScore = Number(m?.normalisedScore);
    const score = Number.isFinite(numericScore) ? numericScore : null;
    return {
      dimension: dim,
      score,
      grade: m?.grade || '-',
      rawValue: m?.rawValue,
      unit: m?.unit || '',
    };
  });

  const populatedCells = cells.filter((cell) => cell.score != null);
  const avgScore = populatedCells.length
    ? populatedCells.reduce((sum, cell) => sum + cell.score, 0) / populatedCells.length
    : null;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.02em' }}>
          {populatedCells.length}/{DIMENSION_ORDER.length} dimensions scored
        </div>
        <div style={{
          border: '1px solid rgba(95,121,183,0.34)',
          background: 'rgba(13,22,43,0.78)',
          borderRadius: 999,
          padding: '4px 10px',
          color: '#bfd2fb',
          fontSize: '0.75rem',
          fontWeight: 650,
        }}>
          Avg: {avgScore == null ? '--' : avgScore.toFixed(1)}
        </div>
      </div>

      {/* Main heatmap row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 8,
      }}>
        {cells.map((cell) => {
          const bg = scoreToColor(cell.score);
          return (
            <div
              key={cell.dimension}
              style={{
                background: bg,
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '16px 10px 14px',
                textAlign: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              title={`${formatLabel(cell.dimension)}: ${formatScore(cell.score)} (${cell.grade})`}
            >
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {cell.score == null ? '--' : cell.score.toFixed(0)}
              </div>
              <div style={{
                marginTop: 8,
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.92)',
                textTransform: 'uppercase',
              }}>
                {formatLabel(cell.dimension)}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.82)',
                marginTop: 6,
                fontWeight: 600,
              }}>
                Grade {cell.grade}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.68)', marginTop: 3 }}>
                Raw {formatRaw(cell.rawValue, cell.unit)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Color legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        <span>Critical</span>
        <div style={{
          width: 240,
          maxWidth: '58vw',
          height: 10,
          borderRadius: 5,
          background: 'linear-gradient(90deg, #ff1744, #ff9100, #ffd600, #00d4ff, #00e676)',
        }} />
        <span>Excellent</span>
      </div>
    </div>
  );
}

function scoreToColor(score) {
  if (score == null) return 'linear-gradient(140deg, rgba(39, 50, 84, 0.7), rgba(26, 36, 64, 0.78))';
  if (score >= 85) return 'rgba(0, 230, 118, 0.7)';
  if (score >= 70) return 'rgba(0, 212, 255, 0.6)';
  if (score >= 55) return 'rgba(255, 214, 0, 0.55)';
  if (score >= 40) return 'rgba(255, 145, 0, 0.55)';
  return 'rgba(255, 23, 68, 0.6)';
}

function normalizeDimension(value) {
  return String(value || '').trim().toLowerCase();
}

function formatLabel(value) {
  const normalized = normalizeDimension(value);
  return normalized || 'Unknown';
}

function formatScore(score) {
  return score == null ? '--' : score.toFixed(1);
}

function formatRaw(rawValue, unit) {
  if (rawValue == null || rawValue === '') return '--';
  const numeric = Number(rawValue);
  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(1).replace(/\.0$/, '')}${unit || ''}`;
  }
  return `${rawValue}${unit || ''}`;
}

export default ScoreHeatmap;
