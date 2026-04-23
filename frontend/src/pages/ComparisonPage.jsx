import React, { useState } from 'react';
import Tabs from '../components/Tabs';
import ComparisonChart from '../components/ComparisonChart';
import './ComparisonPage.css';

const ComparisonPage = () => {
  const [selectedProjects] = useState([
    {
      id: 1,
      name: 'Project Alpha',
      overall_score: 85,
      code_quality_score: 88,
      performance_score: 82,
      maintainability_score: 80,
      security_score: 87,
      complexity_score: 75,
      files_count: 45,
      lines_of_code: 12500,
    },
    {
      id: 2,
      name: 'Project Beta',
      overall_score: 78,
      code_quality_score: 75,
      performance_score: 80,
      maintainability_score: 76,
      security_score: 79,
      complexity_score: 82,
      files_count: 58,
      lines_of_code: 18900,
    },
    {
      id: 3,
      name: 'Project Gamma',
      overall_score: 92,
      code_quality_score: 94,
      performance_score: 90,
      maintainability_score: 91,
      security_score: 93,
      complexity_score: 68,
      files_count: 32,
      lines_of_code: 9200,
    },
  ]);

  const tabsConfig = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      content: () => (
        <div className="tab-content-overview">
          <h3>Project Analysis Overview</h3>
          <p>Compare multiple projects at a glance with different visualization types.</p>
          <div className="overview-stats">
            <div className="overview-stat">
              <span className="stat-num">{selectedProjects.length}</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="overview-stat">
              <span className="stat-num">
                {(selectedProjects.reduce((sum, p) => sum + p.overall_score, 0) / selectedProjects.length).toFixed(1)}
              </span>
              <span className="stat-label">Avg Score</span>
            </div>
            <div className="overview-stat">
              <span className="stat-num">
                {selectedProjects.reduce((sum, p) => sum + p.files_count, 0)}
              </span>
              <span className="stat-label">Total Files</span>
            </div>
            <div className="overview-stat">
              <span className="stat-num">
                {(selectedProjects.reduce((sum, p) => sum + p.lines_of_code, 0) / 1000).toFixed(1)}K
              </span>
              <span className="stat-label">Lines of Code</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'bar-chart',
      label: 'Bar Chart',
      icon: '📈',
      badge: selectedProjects.length,
      content: () => (
        <ComparisonChart projects={selectedProjects} chartType="bar" />
      ),
    },
    {
      id: 'scatter',
      label: 'Scatter View',
      icon: '⚡',
      badge: selectedProjects.length,
      content: () => (
        <ComparisonChart projects={selectedProjects} chartType="scatter" />
      ),
    },
    {
      id: 'radar',
      label: 'Radar Chart',
      icon: '🎯',
      badge: selectedProjects.length,
      content: () => (
        <ComparisonChart projects={selectedProjects} chartType="radar" />
      ),
    },
    {
      id: 'details',
      label: 'Details',
      icon: '📋',
      content: () => (
        <div className="comparison-details">
          <h3>Project Details</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Score</th>
                <th>Quality</th>
                <th>Performance</th>
                <th>Security</th>
                <th>Files</th>
              </tr>
            </thead>
            <tbody>
              {selectedProjects.map((project) => (
                <tr key={project.id}>
                  <td className="project-name">{project.name}</td>
                  <td>
                    <span className="score-badge">{project.overall_score}</span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.code_quality_score}%` }}
                      />
                    </div>
                    {project.code_quality_score}%
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.performance_score}%` }}
                      />
                    </div>
                    {project.performance_score}%
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.security_score}%` }}
                      />
                    </div>
                    {project.security_score}%
                  </td>
                  <td className="text-center">{project.files_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="comparison-page">
      <div className="page-header">
        <h1>📊 Project Comparison Dashboard</h1>
        <p>Analyze and compare multiple projects with interactive visualizations</p>
      </div>

      <div className="comparison-main">
        <Tabs tabs={tabsConfig} defaultActiveTab={0} />
      </div>
    </div>
  );
};

export default ComparisonPage;
