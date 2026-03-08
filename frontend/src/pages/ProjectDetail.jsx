import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_DETAIL, RUN_ANALYSIS } from '../graphql/queries';
import OverallScoreGauge from '../components/OverallScoreGauge';
import DimensionRadarChart from '../components/DimensionRadarChart';
import DimensionBarChart from '../components/DimensionBarChart';
import MetricGaugeGrid from '../components/MetricGaugeGrid';
import WeightPieChart from '../components/WeightPieChart';
import TrendLineChart from '../components/TrendLineChart';
import MetricDetailCard from '../components/MetricDetailCard';
import ScoreHeatmap from '../components/ScoreHeatmap';
import ProjectSummary from '../components/ProjectSummary';
import ProjectReportDownload from '../components/ProjectReportDownload';

function ProjectDetail() {
  const { id } = useParams();
  const { loading, error, data, refetch } = useQuery(GET_PROJECT_DETAIL, {
    variables: { id },
  });
  const [runAnalysis, { loading: analysing }] = useMutation(RUN_ANALYSIS);
  const [analysisError, setAnalysisError] = React.useState(null);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="empty-state"><h3>Error</h3><p>{error.message}</p></div>;

  const project = data?.project;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  const run = project.latestRun;
  const metrics = run?.metrics || [];
  const configs = data?.dimensionConfigs || [];
  const trends = project.trends || [];
  const runs = project.analysisRuns || [];

  const handleRunAnalysis = async () => {
    setAnalysisError(null);
    try {
      const { data: result } = await runAnalysis({ variables: { projectId: project.id } });
      const resp = result?.runAnalysis;
      if (resp && !resp.success) {
        setAnalysisError(resp.message || 'Analysis failed.');
        return;
      }
      refetch();
    } catch (err) {
      setAnalysisError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{project.name}</h2>
          <p>{project.description || 'AI-powered project analysis report'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {run && <OverallScoreGauge score={run.overallScore} grade={run.overallGrade} size={80} />}
          <button
            className="btn btn-primary"
            onClick={handleRunAnalysis}
            disabled={analysing}
          >
            {analysing ? '⏳ Analysing...' : '▶ Run Analysis'}
          </button>
          {analysisError && (
            <div style={{ background: '#fee', color: '#c00', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', marginTop: 8 }}>
              {analysisError}
            </div>
          )}
        </div>
      </div>

      {!run ? (
        <div className="empty-state">
          <h3>No analysis data yet</h3>
          <p>Click "Run Analysis" to collect real-time metrics and generate your project report.</p>
        </div>
      ) : (
        <>
          {/* Row 1: Radar + Bar + Pie */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="card">
              <h3 className="card-title">📊 Dimension Radar</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Overall project health across all 7 dimensions
              </p>
              <DimensionRadarChart metrics={metrics} />
            </div>
            <div className="card">
              <h3 className="card-title">📈 Score Comparison</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Normalised scores with threshold indicators
              </p>
              <DimensionBarChart metrics={metrics} />
            </div>
            <div className="card">
              <h3 className="card-title">⚖️ Weight Distribution</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                How each dimension contributes to the overall score
              </p>
              <WeightPieChart metrics={metrics} configs={configs} />
            </div>
          </div>

          {/* Row 2: Individual Metric Gauges */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title">🎯 Metric Gauges — Real-Time Scores</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Individual performance gauges for each dimension
            </p>
            <MetricGaugeGrid metrics={metrics} />
          </div>

          {/* Row 3: Score Heatmap */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title">🗺️ Score Heatmap</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Visual heatmap of scores across all dimensions
            </p>
            <ScoreHeatmap metrics={metrics} runs={runs} />
          </div>

          {/* Row 4: Trend Charts per dimension */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title">📉 Historical Trends</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Metric trends over time for each dimension
            </p>
            <TrendLineChart trends={trends} />
          </div>

          {/* Row 5: Detailed Metric Cards */}
          <h3 style={{ marginBottom: 16, fontSize: '1.2rem' }}>📋 Dimension Detail Report</h3>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {metrics.map((metric) => (
              <MetricDetailCard key={metric.id} metric={metric} configs={configs} />
            ))}
          </div>

          {/* Row 6: AI Summary & PDF Report */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <ProjectSummary projectId={project.id} />
            </div>
            <div className="card">
              <ProjectReportDownload projectId={project.id} projectName={project.name} />
            </div>
          </div>

          {/* Run History */}
          <div className="card">
            <h3 className="card-title">🕒 Analysis History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Run ID</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>Grade</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{r.id.slice(0, 8)}…</td>
                    <td style={tdStyle}><span className="tag">{r.status}</span></td>
                    <td style={tdStyle}>{r.overallScore?.toFixed(1) ?? '—'}</td>
                    <td style={tdStyle}>
                      <span className={`grade-badge grade-${r.overallGrade}`}>{r.overallGrade}</span>
                    </td>
                    <td style={tdStyle}>{r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 };
const tdStyle = { padding: '10px 12px', fontSize: '0.9rem' };

export default ProjectDetail;
