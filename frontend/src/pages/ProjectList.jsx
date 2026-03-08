import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_ALL_PROJECTS, DELETE_PROJECT, RUN_ANALYSIS } from '../graphql/queries';
import OverallScoreGauge from '../components/OverallScoreGauge';
import MiniRadarChart from '../components/MiniRadarChart';
import './ProjectList.css';

function ProjectList() {
  const { loading, error, data, refetch } = useQuery(GET_ALL_PROJECTS);
  const [deleteProject] = useMutation(DELETE_PROJECT);
  const [runAnalysis, { loading: analysing }] = useMutation(RUN_ANALYSIS);
  const [analysisError, setAnalysisError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, name, score
  const navigate = useNavigate();

  if (loading) return (
    <div className="loading-container">
      <div className="spinner-large" />
      <p>Loading your projects...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3>Error Loading Projects</h3>
      <p>{error.message}</p>
      <button className="btn btn-primary" onClick={() => refetch()}>Try Again</button>
    </div>
  );

  let projects = data?.allProjects || [];

  // Filter by search query
  if (searchQuery) {
    projects = projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort projects
  projects = [...projects].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'score') {
      const scoreA = a.latestRun?.overallScore || 0;
      const scoreB = b.latestRun?.overallScore || 0;
      return scoreB - scoreA;
    }
    return 0; // recent (default order from API)
  });

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

  // Calculate stats
  const totalProjects = projects.length;
  const analyzedProjects = projects.filter(p => p.latestRun).length;
  const avgScore = analyzedProjects > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.latestRun?.overallScore || 0), 0) / analyzedProjects)
    : 0;
  const excellentProjects = projects.filter(p => 
    p.latestRun?.overallGrade && ['A+', 'A'].includes(p.latestRun.overallGrade)
  ).length;

  if (totalProjects === 0) {
    return (
      <div className="empty-state-modern">
        <div className="empty-icon">📂</div>
        <h2>No Projects Yet</h2>
        <p>Create your first project to start analyzing code quality with AI-powered insights</p>
        <div className="empty-actions">
          <Link to="/new" className="btn btn-primary btn-large">
            <span className="btn-icon">+</span> Create Your First Project
          </Link>
          <button className="btn btn-secondary btn-large" onClick={() => navigate('/pricing')}>
            View Pricing Plans
          </button>
        </div>
        <div className="empty-features">
          <div className="empty-feature">
            <span className="feature-icon">🚀</span>
            <span>Fast Analysis</span>
          </div>
          <div className="empty-feature">
            <span className="feature-icon">📊</span>
            <span>7 Dimensions</span>
          </div>
          <div className="empty-feature">
            <span className="feature-icon">🎯</span>
            <span>AI-Powered</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="dashboard-title">Projects Dashboard</h1>
          <p className="dashboard-subtitle">AI-powered project analysis across 7 quality dimensions</p>
        </div>
        <Link to="/new" className="btn-hero-cta">
          <span className="cta-icon">+</span> New Project
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{analyzedProjects}</div>
            <div className="stat-label">Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{avgScore}%</div>
            <div className="stat-label">Avg Score</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{excellentProjects}</div>
            <div className="stat-label">Excellent</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="dashboard-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {analysisError && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{analysisError}</span>
          <button className="alert-close" onClick={() => setAnalysisError(null)}>✕</button>
        </div>
      )}

      {/* Projects Grid */}
      <div className="projects-grid">
        {projects.map((project) => {
          const run = project.latestRun;
          const metrics = run?.metrics || [];
          const hasAnalysis = !!run;

          return (
            <div key={project.id} className="project-card">
              {/* Card Header */}
              <div className="project-card-header">
                <div className="project-info">
                  <h3 className="project-name">
                    <Link to={`/project/${project.id}`}>{project.name}</Link>
                  </h3>
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                </div>
                {hasAnalysis && (
                  <div className="project-score">
                    <OverallScoreGauge score={run.overallScore} grade={run.overallGrade} size={70} />
                  </div>
                )}
              </div>

              {/* Radar Chart */}
              {metrics.length > 0 && (
                <div className="project-chart">
                  <MiniRadarChart metrics={metrics} size={220} />
                </div>
              )}

              {/* Metrics Tags */}
              {metrics.length > 0 && (
                <div className="metrics-tags">
                  {metrics.map((m) => (
                    <span
                      key={m.dimension}
                      className="metric-tag"
                      style={{
                        background: getGradeColor(m.grade, 0.15),
                        color: getGradeColor(m.grade, 1),
                        borderColor: getGradeColor(m.grade, 0.4),
                      }}
                    >
                      {m.dimension}: {m.grade}
                    </span>
                  ))}
                </div>
              )}

              {/* No Analysis State */}
              {!hasAnalysis && (
                <div className="no-analysis-state">
                  <p>No analysis yet. Run your first analysis to get insights.</p>
                </div>
              )}

              {/* Card Actions */}
              <div className="project-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRunAnalysis(project.id)}
                  disabled={analysing}
                >
                  {analysing ? '⏳ Analyzing...' : '▶ Run Analysis'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  📊 View Report
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(project.id, project.name)}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {projects.length === 0 && searchQuery && (
        <div className="no-results">
          <p>No projects found matching "{searchQuery}"</p>
          <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      )}
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
