import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_ALL_PROJECTS, DELETE_PROJECT, RUN_ANALYSIS } from '../graphql/queries';
import OverallScoreGauge from '../components/OverallScoreGauge';
import MiniRadarChart from '../components/MiniRadarChart';
import './ProjectList.css';

function DashboardIcon({ name, className = '' }) {
  const classes = `ui-icon ${className}`.trim();

  if (name === 'projects') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2.5 5.8a1.8 1.8 0 0 1 1.8-1.8h3l1.4 1.5h6.9a1.8 1.8 0 0 1 1.8 1.8v7a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8v-8.5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === 'files') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M6 2.8h5.2L15 6.6V16a1.2 1.2 0 0 1-1.2 1.2H6A1.2 1.2 0 0 1 4.8 16V4A1.2 1.2 0 0 1 6 2.8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11.1 2.9V6.6H15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === 'issues') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="7" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 16c.7-2.3 2-3.6 3.5-3.6h6c1.6 0 2.8 1.3 3.5 3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'suggestions') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2.5a5 5 0 0 0-2.6 9.2c.7.4 1.2 1 1.3 1.8h2.6c.1-.8.6-1.4 1.3-1.8A5 5 0 0 0 10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.6 15h2.8M8.9 17h2.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12.2 12.2L16.5 16.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'alert') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 3.2L17 16H3l7-12.8z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 7.6v3.9M10 13.8v.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'play') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M6.2 4.6L14.8 10l-8.6 5.4V4.6z" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'report') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M6 2.8h5.2L15 6.6V16a1.2 1.2 0 0 1-1.2 1.2H6A1.2 1.2 0 0 1 4.8 16V4A1.2 1.2 0 0 1 6 2.8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.6 10.2h4.8M7.6 12.8h4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'trash') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4.8 5.8h10.4M8.2 5.8V4.3h3.6v1.5M7 8.2v6M10 8.2v6M13 8.2v6M6.4 5.8l.7 10.2h5.8l.7-10.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'activity') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.2 10h3l1.7-3.3 3.1 6 2.1-4.2h3.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'quality') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4.2 15.8V9.7M8.3 15.8V6.5M12.4 15.8V11.2M16.5 15.8V4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'ai') {
    return (
      <svg className={classes} viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.6v2M10 15.4v2M2.6 10h2M15.4 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'folder-hero') {
    return (
      <svg className={classes} viewBox="0 0 120 90" aria-hidden="true">
        <defs>
          <linearGradient id="folderGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe682" />
            <stop offset="1" stopColor="#ffbf48" />
          </linearGradient>
        </defs>
        <path d="M8 24c0-7 5-12 12-12h20l8 10h52c7 0 12 5 12 12v34c0 7-5 12-12 12H20c-7 0-12-5-12-12V24z" fill="url(#folderGrad)" />
        <path d="M8 37h104" stroke="#f0b74b" strokeWidth="2.5" opacity=".45" />
      </svg>
    );
  }

  return null;
}

function ProjectList() {
  const { loading, error, data, refetch } = useQuery(GET_ALL_PROJECTS);
  const [deleteProject] = useMutation(DELETE_PROJECT);
  const [runAnalysis, { loading: analysing }] = useMutation(RUN_ANALYSIS);
  const [analysisError, setAnalysisError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, name, score, status
  const navigate = useNavigate();

  if (loading) return (
    <div className="loading-container">
      <div className="spinner-large" />
      <p>Loading your projects...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-state">
      <div className="error-icon"><DashboardIcon name="alert" /></div>
      <h3>Error Loading Projects</h3>
      <p>{error.message}</p>
      <button className="btn btn-primary" onClick={() => refetch()}>Try Again</button>
    </div>
  );

  const allProjects = data?.allProjects || [];
  let projects = [...allProjects];

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
    if (sortBy === 'status') {
      const statusRank = (run) => {
        const status = getProjectStatus(run).tone;
        if (status === 'status-risk') return 0;
        if (status === 'status-review') return 1;
        if (status === 'status-pending') return 2;
        return 3;
      };
      return statusRank(a.latestRun) - statusRank(b.latestRun);
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

  // Calculate stats from complete project set (not filtered list)
  const totalProjects = allProjects.length;
  const analyzedProjects = allProjects.filter((p) => p.latestRun).length;
  const avgScore = analyzedProjects > 0
    ? Math.round(allProjects.reduce((sum, p) => sum + (p.latestRun?.overallScore || 0), 0) / analyzedProjects)
    : 0;
  const filesAnalyzed = allProjects.reduce(
    (sum, p) => sum + (p.latestRun?.metrics?.length || 0),
    0
  );
  const issuesFound = allProjects.reduce(
    (sum, p) => sum + ((p.latestRun?.metrics || []).filter((m) => (m.score || 0) < 70).length),
    0
  );
  const aiSuggestionsGenerated = analyzedProjects;
  const hasProjects = totalProjects > 0;
  const visibleProjectCount = projects.length;
  const userName = getUserNameFromToken();
  const setSort = (next) => setSortBy(next);

  return (
    <div className="dashboard-shell">
      <section className="dashboard-top">
        <div className="dashboard-welcome">
          <h2>Welcome back, {userName}.</h2>
          <p>Start by creating your first project to analyze code quality across 7 AI-powered dimensions.</p>
        </div>
      </section>

      <section className="dashboard-section" aria-label="Overview">
        <div className="section-heading">
          <h3>Overview</h3>
          <p>Live dashboard metrics across your project analyses.</p>
        </div>
        <div className="dashboard-stats-strip" aria-label="Dashboard Stats">
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-icon"><DashboardIcon name="projects" /></span>
            <span className="dashboard-stat-label">Projects Created</span>
            <strong>{totalProjects}</strong>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-icon"><DashboardIcon name="files" /></span>
            <span className="dashboard-stat-label">Files Analyzed</span>
            <strong>{filesAnalyzed}</strong>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-icon"><DashboardIcon name="issues" /></span>
            <span className="dashboard-stat-label">Issues Found</span>
            <strong>{issuesFound}</strong>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-icon"><DashboardIcon name="suggestions" /></span>
            <span className="dashboard-stat-label">AI Suggestions Generated</span>
            <strong>{aiSuggestionsGenerated}</strong>
          </div>
        </div>
      </section>

      {!hasProjects ? (
        <section className="dashboard-section" aria-label="Getting Started" aria-live="polite">
          <div className="section-heading">
            <h3>Getting Started</h3>
            <p>Create your first project to unlock full analysis insights.</p>
          </div>
          <div className="dashboard-empty-hero">
          <div className="empty-hero-illustration" aria-hidden="true">
            <DashboardIcon name="folder-hero" className="folder-hero-icon" />
          </div>
          <div className="empty-hero-content">
            <h3>No Projects Yet</h3>
            <p>
              Start analyzing your code quality with AI insights. Create your first project to view
              performance metrics, maintainability scores, and improvement suggestions.
            </p>
            <div className="empty-hero-actions">
              <Link to="/new" className="btn btn-primary btn-large">
                + Create Project
              </Link>
              <button className="btn btn-secondary btn-large" onClick={() => navigate('/pricing')}>
                View Pricing
              </button>
            </div>
          </div>
          </div>
        </section>
      ) : (
        <section className="dashboard-section" aria-label="Projects">
          <div className="section-heading section-heading-row">
            <div>
              <h3>Projects Workspace</h3>
              <p>Search, sort, run fresh analysis, and review reports for each repository.</p>
            </div>
            <span className="projects-chip">{visibleProjectCount} visible</span>
          </div>

          <div className="dashboard-controls">
            <div className="search-box">
              <span className="search-icon"><DashboardIcon name="search" /></span>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="sort-controls">
              <span className="sort-label">Sort:</span>
              <button type="button" className={`sort-chip ${sortBy === 'recent' ? 'active' : ''}`} onClick={() => setSort('recent')}>
                Recent
              </button>
              <button type="button" className={`sort-chip ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSort('name')}>
                Name
              </button>
              <button type="button" className={`sort-chip ${sortBy === 'score' ? 'active' : ''}`} onClick={() => setSort('score')}>
                Score
              </button>
              <button type="button" className={`sort-chip ${sortBy === 'status' ? 'active' : ''}`} onClick={() => setSort('status')}>
                Status
              </button>
            </div>
          </div>

          {analysisError && (
            <div className="alert alert-error">
              <span className="alert-icon"><DashboardIcon name="alert" /></span>
              <span>{analysisError}</span>
              <button className="alert-close" onClick={() => setAnalysisError(null)}>✕</button>
            </div>
          )}

          <div className="projects-grid-head" aria-hidden="true">
            <button type="button" className={`head-sort-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSort('name')}>
              Project
            </button>
            <button type="button" className={`head-sort-btn ${sortBy === 'status' ? 'active' : ''}`} onClick={() => setSort('status')}>
              Status
            </button>
            <button type="button" className={`head-sort-btn ${sortBy === 'score' ? 'active' : ''}`} onClick={() => setSort('score')}>
              Score
            </button>
            <span>Actions</span>
          </div>

          <div className="projects-grid">
            {projects.map((project) => {
          const run = project.latestRun;
          const metrics = run?.metrics || [];
          const hasAnalysis = !!run;
          const status = getProjectStatus(run);

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
                  <div className="project-meta-row">
                    <span className={`project-status-badge ${status.tone}`}>{status.label}</span>
                    {hasAnalysis && (
                      <span className="project-score-meta">Score {run.overallScore}%</span>
                    )}
                  </div>
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
                  className="btn btn-primary btn-sm project-action-primary"
                  onClick={() => handleRunAnalysis(project.id)}
                  disabled={analysing}
                >
                  {analysing ? 'Analyzing...' : (<><DashboardIcon name="play" />Analyze</>)}
                </button>
                <button
                  className="btn btn-secondary btn-sm project-action-secondary"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <DashboardIcon name="report" />
                  Report
                </button>
                <button
                  className="btn btn-danger btn-sm project-action-danger"
                  onClick={() => handleDelete(project.id, project.name)}
                  aria-label={`Delete ${project.name}`}
                >
                  <DashboardIcon name="trash" />
                </button>
              </div>
            </div>
          );
            })}
          </div>

          {visibleProjectCount === 0 && searchQuery && (
            <div className="no-results">
              <p>No projects found matching "{searchQuery}"</p>
              <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            </div>
          )}
        </section>
      )}

      <section className="dashboard-section" aria-label="Dashboard Highlights">
        <div className="section-heading">
          <h3>Insights Snapshot</h3>
          <p>Quick intelligence from your latest project activity and AI outcomes.</p>
        </div>
        <div className="dashboard-bottom-grid">
          <article className="dashboard-mini-card">
            <span className="mini-card-icon"><DashboardIcon name="activity" /></span>
            <h4>Recent Activity</h4>
            <p>
              {totalProjects > 0
                ? `${analyzedProjects} project${analyzedProjects === 1 ? '' : 's'} analyzed so far.`
                : 'Your recent activity will appear here after creating a project.'}
            </p>
          </article>
          <article className="dashboard-mini-card">
            <span className="mini-card-icon"><DashboardIcon name="quality" /></span>
            <h4>Code Quality Score</h4>
            <p>
              {analyzedProjects > 0
                ? `Average overall score is ${avgScore}% across analyzed projects.`
                : 'Your code quality score will appear here after creating a project.'}
            </p>
          </article>
          <article className="dashboard-mini-card">
            <span className="mini-card-icon"><DashboardIcon name="ai" /></span>
            <h4>AI Suggestions</h4>
            <p>
              {aiSuggestionsGenerated > 0
                ? `${aiSuggestionsGenerated} AI suggestion summary${aiSuggestionsGenerated === 1 ? '' : 'ies'} generated.`
                : 'AI suggestions will appear here after analyzing your code.'}
            </p>
          </article>
        </div>
      </section>

      <footer className="dashboard-footer-note">
        <p>© 2026 AI Project Analyzer. Built with AI-powered static analysis.</p>
      </footer>
    </div>
  );
}

function getUserNameFromToken() {
  const fallback = 'there';
  try {
    const token = localStorage.getItem('jwt_token');
    if (!token) return fallback;
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return fallback;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(window.atob(base64));
    const username = (json.username || '').trim();
    if (!username) return fallback;
    return username.charAt(0).toUpperCase() + username.slice(1);
  } catch {
    return fallback;
  }
}

function getProjectStatus(run) {
  if (!run) return { label: 'Pending Analysis', tone: 'status-pending' };
  const score = run.overallScore || 0;
  if (score >= 85) return { label: 'Healthy', tone: 'status-healthy' };
  if (score >= 70) return { label: 'Needs Review', tone: 'status-review' };
  return { label: 'High Risk', tone: 'status-risk' };
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
