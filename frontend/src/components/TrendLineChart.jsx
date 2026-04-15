import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
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

  const chartData = useMemo(() => {
    // Group trends by run timestamp and normalize dimensions to avoid case mismatches.
    const grouped = {};
    trends.forEach((trend) => {
      const key = trend.recordedAt;
      if (!grouped[key]) grouped[key] = { time: key };
      const dimension = normalizeDimension(trend.dimension);
      const score = Number(trend.score);
      if (ALL_DIMENSIONS.includes(dimension) && Number.isFinite(score)) {
        grouped[key][dimension] = score;
      }
    });

    const ordered = Object.values(grouped)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .map((point, index) => ({
        ...point,
        label: `Run ${index + 1}`,
        runIndex: index + 1,
        timeLabel: new Date(point.time).toLocaleString(),
      }));

    return ordered.map((point, index) => {
      const prev = {};
      if (index > 0) {
        ALL_DIMENSIONS.forEach((dim) => {
          const prevVal = Number(ordered[index - 1][dim]);
          prev[dim] = Number.isFinite(prevVal) ? prevVal : null;
        });
      }
      return {
        ...point,
        prev,
      };
    });
  }, [trends]);

  const latestPoint = chartData[chartData.length - 1] || null;

  const latestRows = useMemo(() => {
    if (!chartData.length) return [];
    return ALL_DIMENSIONS
      .map((dimension) => {
        const snapshot = getLatestDimensionSnapshot(chartData, dimension);
        return {
          dimension,
          latest: snapshot.latest,
          delta: snapshot.delta,
        };
      })
      .filter((row) => row.latest != null)
      .sort((a, b) => b.latest - a.latest);
  }, [chartData]);

  const bestDimension = latestRows[0] || null;
  const lowestDimension = latestRows[latestRows.length - 1] || null;
  const averageScore = latestRows.length
    ? latestRows.reduce((sum, row) => sum + row.latest, 0) / latestRows.length
    : null;
  const summaryCards = useMemo(() => {
    if (!latestRows.length) {
      return {
        best: { value: '--', hint: 'No data' },
        needs: { value: '--', hint: 'No data' },
      };
    }

    if (latestRows.length === 1) {
      return {
        best: {
          value: capitalize(latestRows[0].dimension),
          hint: `${latestRows[0].latest.toFixed(1)} points`,
        },
        needs: {
          value: 'Pending',
          hint: 'Need more dimensions to compare',
        },
      };
    }

    const bestScore = latestRows[0].latest;
    const lowestScore = latestRows[latestRows.length - 1].latest;
    const bestTies = latestRows.filter((row) => row.latest === bestScore);
    const lowestTies = latestRows.filter((row) => row.latest === lowestScore);

    if (bestScore === lowestScore) {
      return {
        best: {
          value: formatCompactDimensionList(latestRows),
          hint: `All ${latestRows.length} dimensions at ${bestScore.toFixed(1)} points`,
        },
        needs: {
          value: 'No Clear Risk',
          hint: 'Scores are currently tied',
        },
      };
    }

    return {
      best: {
        value: bestTies.length > 1 ? formatCompactDimensionList(bestTies) : capitalize(bestDimension.dimension),
        hint: bestTies.length > 1
          ? `${bestTies.length} dimensions at ${bestScore.toFixed(1)} points`
          : `${bestDimension.latest.toFixed(1)} points`,
      },
      needs: {
        value: lowestTies.length > 1 ? formatCompactDimensionList(lowestTies) : capitalize(lowestDimension.dimension),
        hint: lowestTies.length > 1
          ? `${lowestTies.length} dimensions at ${lowestScore.toFixed(1)} points`
          : `${lowestDimension.latest.toFixed(1)} points`,
      },
    };
  }, [bestDimension, lowestDimension, latestRows]);
  const trendStatusByDimension = useMemo(() => {
    const map = {};
    ALL_DIMENSIONS.forEach((dim) => {
      const row = latestRows.find((item) => item.dimension === dim);
      map[dim] = getTrendStatus(row?.delta);
    });
    return map;
  }, [latestRows]);

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
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 8,
      }}>
        <SummaryTile
          label="Latest Average"
          value={averageScore == null ? '--' : averageScore.toFixed(1)}
          hint={latestRows.length ? 'Across latest available dimension scores' : 'No run'}
          color="#00d4ff"
        />
        <SummaryTile
          label="Best Dimension"
          value={summaryCards.best.value}
          hint={summaryCards.best.hint}
          color="#00e676"
        />
        <SummaryTile
          label="Needs Attention"
          value={summaryCards.needs.value}
          hint={summaryCards.needs.hint}
          color="#ff9100"
        />
      </div>

      {/* Dimension toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => setActiveDimensions(new Set(ALL_DIMENSIONS))}
          style={quickActionButtonStyle}
        >
          Show All
        </button>
        <button
          onClick={() => setActiveDimensions(new Set())}
          style={quickActionButtonStyle}
        >
          Clear
        </button>
        {ALL_DIMENSIONS.map((dim) => (
          (() => {
            const latestRow = latestRows.find((row) => row.dimension === dim);
            const status = trendStatusByDimension[dim];
            return (
          <button
            key={dim}
            onClick={() => toggleDimension(dim)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: `1px solid ${DIMENSION_COLORS[dim]}`,
              background: activeDimensions.has(dim) ? DIMENSION_COLORS[dim] + '22' : 'transparent',
              color: activeDimensions.has(dim) ? DIMENSION_COLORS[dim] : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              fontFamily: 'var(--font)',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{capitalize(dim)}</span>
            {latestRow?.latest != null && (
              <span style={{ opacity: 0.95, fontWeight: 700 }}>
                {latestRow.latest.toFixed(0)}
              </span>
            )}
            <span style={{
              fontSize: '0.66rem',
              borderRadius: 999,
              padding: '1px 6px',
              border: `1px solid ${status.color}`,
              color: status.color,
              background: `${status.color}1A`,
              fontWeight: 700,
            }}>
              {status.label}
            </span>
          </button>
            );
          })()
        ))}
      </div>

      <ResponsiveContainer width="100%" height={390}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#a0a0b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: '#a0a0b8' }}
          />
          <ReferenceLine y={85} stroke="rgba(0, 230, 118, 0.32)" strokeDasharray="4 4" />
          <ReferenceLine y={70} stroke="rgba(0, 212, 255, 0.24)" strokeDasharray="4 4" />
          <ReferenceLine y={40} stroke="rgba(255, 145, 0, 0.24)" strokeDasharray="4 4" />
          <Tooltip
            content={<TrendTooltip activeDimensions={activeDimensions} />}
          />
          {ALL_DIMENSIONS.filter((d) => activeDimensions.has(d)).map((dim) => (
            <Line
              key={dim}
              type="monotone"
              dataKey={dim}
              name={capitalize(dim)}
              stroke={DIMENSION_COLORS[dim]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>
        Tip: Use the dimension chips to isolate one or two lines for clearer comparison.
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload, label, activeDimensions }) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = payload
    .filter((entry) => activeDimensions.has(entry.dataKey) && Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  const point = payload[0]?.payload;

  return (
    <div style={{
      background: 'rgba(13, 21, 43, 0.96)',
      border: '1px solid rgba(88, 108, 164, 0.46)',
      borderRadius: 10,
      padding: '10px 12px',
      minWidth: 190,
      boxShadow: '0 12px 24px rgba(4, 8, 19, 0.28)',
    }}>
      <div style={{ color: '#eaf0ff', fontSize: '0.82rem', fontWeight: 700 }}>{label}</div>
      <div style={{ color: '#9fb0d2', fontSize: '0.72rem', marginTop: 2, marginBottom: 6 }}>
        {payload[0]?.payload?.timeLabel}
      </div>
      {rows.map((entry) => (
        (() => {
          const previous = point && Number.isFinite(point.prev?.[entry.dataKey]) ? point.prev[entry.dataKey] : null;
          const delta = previous == null ? null : entry.value - previous;
          const status = getTrendStatus(delta);
          return (
        <div key={entry.dataKey} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.76rem',
          marginTop: 3,
        }}>
          <span style={{ color: entry.color, fontWeight: 650 }}>{capitalize(entry.dataKey)}</span>
          <span style={{ color: '#d7e4ff', fontWeight: 700 }}>
            {entry.value.toFixed(1)}
            <span style={{
              marginLeft: 6,
              fontSize: '0.68rem',
              color: status.color,
              fontWeight: 700,
            }}>
              {status.short}
            </span>
          </span>
        </div>
          );
        })()
      ))}
    </div>
  );
}

function SummaryTile({ label, value, hint, color }) {
  return (
    <div style={{
      border: '1px solid rgba(88, 108, 164, 0.34)',
      borderRadius: 10,
      background: 'rgba(13, 22, 43, 0.7)',
      padding: '10px 12px',
    }}>
      <div style={{ color: '#9fb0d2', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ color, fontSize: '1rem', fontWeight: 750, marginTop: 2 }}>
        {value}
      </div>
      <div style={{ color: '#aebddd', fontSize: '0.72rem', marginTop: 2 }}>
        {hint}
      </div>
    </div>
  );
}

const quickActionButtonStyle = {
  padding: '6px 10px',
  borderRadius: 20,
  border: '1px solid rgba(95,121,183,0.46)',
  background: 'rgba(20, 30, 56, 0.82)',
  color: '#bfd2fb',
  cursor: 'pointer',
  fontSize: '0.74rem',
  fontWeight: 650,
};

function normalizeDimension(value) {
  return String(value || '').trim().toLowerCase();
}

function getLatestDimensionSnapshot(points, dimension) {
  let latest = null;
  let previous = null;

  for (let idx = points.length - 1; idx >= 0; idx -= 1) {
    const value = Number(points[idx]?.[dimension]);
    if (!Number.isFinite(value)) continue;

    if (latest == null) {
      latest = value;
    } else {
      previous = value;
      break;
    }
  }

  return {
    latest,
    delta: latest != null && previous != null ? latest - previous : null,
  };
}

function formatCompactDimensionList(rows) {
  const names = rows.map((row) => capitalize(row.dimension));
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

function getTrendStatus(delta) {
  if (!Number.isFinite(delta)) {
    return { label: 'No Data', short: 'ND', color: '#9fb0d2' };
  }
  if (delta >= 2) {
    return { label: 'Improving', short: 'Up', color: '#00e676' };
  }
  if (delta <= -2) {
    return { label: 'Declining', short: 'Down', color: '#ff9100' };
  }
  return { label: 'Stable', short: 'Flat', color: '#00d4ff' };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default TrendLineChart;
