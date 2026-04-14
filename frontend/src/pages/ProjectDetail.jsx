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
import ProjectComparison from '../components/ProjectComparison';
import './ProjectDetail.css';

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
  const latestStatus = run?.status || 'Not Run';
  const latestGrade = run?.overallGrade || '—';

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
    <div className="detail-page">
      <section className="detail-panel detail-hero">
        <div className="detail-hero-copy">
          <h2>{project.name}</h2>
          <p>{project.description || 'AI-powered project analysis report'}</p>
          <div className="detail-meta-strip">
            <span className="detail-meta-item">
              <strong>{runs.length}</strong>
              <span>Total Runs</span>
            </span>
            <span className="detail-meta-item">
              <strong>{latestStatus}</strong>
              <span>Latest Status</span>
            </span>
            <span className="detail-meta-item">
              <strong>{latestGrade}</strong>
              <span>Latest Grade</span>
            </span>
          </div>
        </div>
        <div className="detail-hero-actions">
          {run && <OverallScoreGauge score={run.overallScore} grade={run.overallGrade} size={78} />}
          <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={analysing}>
            {analysing ? 'Analysing...' : 'Run Analysis'}
          </button>
        </div>
      </section>

      {analysisError && (
        <div className="detail-inline-error">{analysisError}</div>
      )}

      {!run ? (
        <div className="empty-state">
          <h3>No analysis data yet</h3>
          <p>Click "Run Analysis" to collect real-time metrics and generate your project report.</p>
        </div>
      ) : (
        <>
          <section className="detail-panel">
            <div className="detail-section-head">
              <div>
                <span className="detail-kicker">Overview Charts</span>
                <h3>Performance Overview</h3>
                <p>Core score visualizations across dimensions and weighting.</p>
              </div>
              <span className="detail-head-meta">3 chart cards</span>
            </div>
            <div className="detail-grid-3">
              <div className="detail-card detail-chart-card">
                <h4 className="detail-card-title">Dimension Radar</h4>
                <p className="detail-card-note">Overall project health across all 7 dimensions</p>
                <DimensionRadarChart metrics={metrics} />
              </div>
              <div className="detail-card detail-chart-card">
                <h4 className="detail-card-title">Score Comparison</h4>
                <p className="detail-card-note">Normalised scores with threshold indicators</p>
                <DimensionBarChart metrics={metrics} />
              </div>
              <div className="detail-card detail-chart-card">
                <h4 className="detail-card-title">Weight Distribution</h4>
                <p className="detail-card-note">How each dimension contributes to the overall score</p>
                <WeightPieChart metrics={metrics} configs={configs} />
              </div>
            </div>
          </section>

          <section className="detail-panel detail-card-panel detail-spacious-panel">
            <div className="detail-section-head">
              <div>
                <span className="detail-kicker">Metric Gauges</span>
                <h3>Real-Time Dimension Scores</h3>
                <p>Individual performance gauges for each analysis dimension.</p>
              </div>
              <span className="detail-head-meta">Live snapshot</span>
            </div>
            <div className="detail-content-frame">
              <MetricGaugeGrid metrics={metrics} />
            </div>
          </section>

          <section className="detail-panel detail-card-panel detail-spacious-panel">
            <div className="detail-section-head">
              <div>
                <span className="detail-kicker">Score Heatmap</span>
                <h3>Cross-Run Intensity View</h3>
                <p>Visual intensity map of score movements across dimensions.</p>
              </div>
              <span className="detail-head-meta">Historical matrix</span>
            </div>
            <div className="detail-content-frame">
              <ScoreHeatmap metrics={metrics} runs={runs} />
            </div>
          </section>

          <section className="detail-panel detail-card-panel">
            <div className="detail-section-head">
              <div>
                <span className="detail-kicker">Historical Trends</span>
                <h3>Score Trajectory Over Time</h3>
                <p>Trend lines for each dimension to spot regressions and improvements.</p>
              </div>
              <span className="detail-head-meta">Time series</span>
            </div>
            <div className="detail-content-frame">
              <TrendLineChart trends={trends} />
            </div>
          </section>

          <section className="detail-panel">
            <div className="detail-section-head">
              <div>
                <span className="detail-kicker">Dimension Detail Report</span>
                <h3>Per-Dimension Analysis Notes</h3>
                <p>Detailed recommendations and score-level diagnostics per dimension.</p>
              </div>
              <span className="detail-head-meta">{metrics.length} dimensions</span>
            </div>
            <div className="detail-grid-2 detail-metric-grid">
              {metrics.map((metric) => (
                <MetricDetailCard key={metric.id} metric={metric} configs={configs} />
              ))}
            </div>
          </section>

          <section className="detail-panel">
            <div className="detail-section-head">
              <div>
                <span className="detail-kicker">Executive Summary & Reports</span>
                <h3>Decision-Ready Output</h3>
                <p>AI narrative summary and exportable report pack for stakeholders.</p>
              </div>
              <span className="detail-head-meta">Summary + PDF</span>
            </div>
            <div className="detail-grid-2">
              <div className="detail-card">
                <h4 className="detail-card-title">AI Summary</h4>
                <p className="detail-card-note">Concise natural-language interpretation of your latest run.</p>
                <ProjectSummary projectId={project.id} />
              </div>
              <div className="detail-card">
                <h4 className="detail-card-title">Export & Share</h4>
                <p className="detail-card-note">Generate a professional report document for external review.</p>
                <ProjectReportDownload projectId={project.id} projectName={project.name} />
              </div>
            </div>
          </section>

          <section className="detail-panel">
            <div className="detail-section-head">
              <h3>Project Comparison</h3>
              <p>Compare this project with your other repositories.</p>
            </div>
            <div className="detail-card">
              <ProjectComparison projectId={project.id} />
            </div>
          </section>

          <section className="detail-panel detail-card-panel">
            <div className="detail-section-head">
              <h3>Analysis History</h3>
              <p>Recent runs and historical outcomes for audit and tracking.</p>
            </div>
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id.slice(0, 8)}…</td>
                      <td><span className="tag">{r.status}</span></td>
                      <td>{r.overallScore?.toFixed(1) ?? '—'}</td>
                      <td>
                        <span className={`grade-badge grade-${r.overallGrade}`}>{r.overallGrade}</span>
                      </td>
                      <td>{r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ProjectDetail;
