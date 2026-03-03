import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import './ComparisonChart.css';

const ComparisonChart = ({ projects = [], selectedMetric = 'overall_score', chartType = 'bar' }) => {
  // Prepare data based on selected metric
  const chartData = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    return projects.map((project) => ({
      name: project.name?.substring(0, 15) || 'Project',
      overall_score: project.overall_score || 0,
      code_quality: project.code_quality_score || 0,
      performance: project.performance_score || 0,
      maintainability: project.maintainability_score || 0,
      security: project.security_score || 0,
      complexity: project.complexity_score || 0,
      files_count: project.files_count || 0,
      lines_of_code: (project.lines_of_code || 0) / 100, // Scale down for comparison
    }));
  }, [projects]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="comparison-chart-empty">
        <p>No projects available for comparison</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="overall_score" label={{ value: 'Overall Score', position: 'insideBottomRight', offset: -10 }} />
              <YAxis label={{ value: 'Code Quality', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Scatter name="Projects" data={chartData} fill="var(--accent)" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="name" stroke="var(--text-secondary)" />
              <PolarRadiusAxis stroke="var(--text-secondary)" />
              <Radar
                name="Code Quality"
                dataKey="code_quality"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.3}
              />
              <Radar
                name="Performance"
                dataKey="performance"
                stroke="var(--accent-green)"
                fill="var(--accent-green)"
                fillOpacity={0.2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              <Bar dataKey="overall_score" fill="var(--accent)" name="Overall Score" />
              <Bar dataKey="code_quality" fill="var(--accent-alt)" name="Code Quality" />
              <Bar dataKey="performance" fill="var(--accent-green)" name="Performance" />
              <Bar dataKey="security" fill="var(--accent-yellow)" name="Security" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="comparison-chart-container">
      <div className="comparison-chart-header">
        <h3>Project Comparison</h3>
        <p className="comparison-chart-subtitle">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'} selected
        </p>
      </div>
      <div className="comparison-chart-content">
        {renderChart()}
      </div>
      {chartData.length > 0 && (
        <div className="comparison-chart-stats">
          <div className="stat-card">
            <span className="stat-label">Average Score</span>
            <span className="stat-value">
              {(chartData.reduce((sum, item) => sum + item.overall_score, 0) / chartData.length).toFixed(1)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Highest Score</span>
            <span className="stat-value">
              {Math.max(...chartData.map((item) => item.overall_score)).toFixed(1)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Lowest Score</span>
            <span className="stat-value">
              {Math.min(...chartData.map((item) => item.overall_score)).toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonChart;
