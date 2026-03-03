import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_ALL_PROJECTS, DELETE_PROJECT, RUN_ANALYSIS } from '../graphql/queries';
import OverallScoreGauge from '../components/OverallScoreGauge';
import MiniRadarChart from '../components/MiniRadarChart';

function ProjectList() {
  const { loading, error, data, refetch } = useQuery(GET_ALL_PROJECTS);
  const [deleteProject] = useMutation(DELETE_PROJECT);
  const [runAnalysis, { loading: analysing }] = useMutation(RUN_ANALYSIS);
  const [analysisError, setAnalysisError] = React.useState(null);
  const navigate = useNavigate();

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="empty-state"><h3>Error loading projects</h3><p>{error.message}</p></div>;

  const projects = data?.allProjects || [];

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"?`)) return;
    await deleteProject({ variables: { id } });
    refetch();
  };

  const handleRunAnalysis = async (projectId) => {
    setAnalysisError(null);
    try {
      const { data: result } = await runAnalysis({ variables: { projectId } });
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

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <h3>No projects yet</h3>
        <p>Create your first project to start analysing.</p>
        <Link to="/new" className="btn btn-primary" style={{ marginTop: 16 }}>
          + Create Project
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Projects Dashboard</h2>
        <p>Real-time AI-powered project analysis across 7 dimensions</p>
      </div>

      {analysisError && (
        <div style={{ background: '#fee', color: '#c00', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
          {analysisError}
        </div>
      )}

      <div className="grid-2">
        {projects.map((project) => {
          const run = project.latestRun;
          const metrics = run?.metrics || [];
          return (
            <div key={project.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <Link to={`/project/${project.id}`}>{project.name}</Link>
                  </h3>
                  {project.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {project.description}
                    </p>
                  )}
                </div>
                {run && <OverallScoreGauge score={run.overallScore} grade={run.overallGrade} size={60} />}
              </div>

              {metrics.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                  <MiniRadarChart metrics={metrics} size={200} />
                </div>
              )}

              {metrics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {metrics.map((m) => (
                    <span key={m.dimension} className="tag" style={{
                      background: getGradeColor(m.grade, 0.12),
                      color: getGradeColor(m.grade, 1),
                    }}>
                      {m.dimension}: {m.grade}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRunAnalysis(project.id)}
                  disabled={analysing}
                >
                  {analysing ? 'Analysing...' : '▶ Run Analysis'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  View Report
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(project.id, project.name)}
                  style={{ marginLeft: 'auto' }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getGradeColor(grade, alpha = 1) {
  const colors = {
    'A+': `rgba(0, 230, 118, ${alpha})`,
    'A': `rgba(0, 212, 255, ${alpha})`,
    'B': `rgba(0, 180, 220, ${alpha})`,
    'C': `rgba(255, 214, 0, ${alpha})`,
    'D': `rgba(255, 145, 0, ${alpha})`,
    'E': `rgba(255, 23, 68, ${alpha})`,
    'F': `rgba(255, 23, 68, ${alpha})`,
  };
  return colors[grade] || `rgba(160, 160, 184, ${alpha})`;
}

export default ProjectList;
