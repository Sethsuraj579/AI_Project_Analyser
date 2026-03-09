import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_PROJECTS, GET_PROJECT_COMPARISON } from '../graphql/queries';
import './ProjectComparison.css';

function scoreText(score) {
  return score === null || score === undefined ? '--' : Number(score).toFixed(1);
}

function deltaClass(delta) {
  if (delta === null || delta === undefined) return 'neutral';
  if (delta > 0) return 'positive';
  if (delta < 0) return 'negative';
  return 'neutral';
}

function ProjectComparison({ projectId }) {
  const [compareWithId, setCompareWithId] = useState('');

  const { data: listData, loading: loadingList } = useQuery(GET_ALL_PROJECTS);

  const options = useMemo(() => {
    const projects = listData?.allProjects || [];
    return projects.filter((p) => p.id !== projectId);
  }, [listData, projectId]);

  useEffect(() => {
    if (!compareWithId && options.length > 0) {
      setCompareWithId(options[0].id);
    }
  }, [compareWithId, options]);

  const { data, loading, error, refetch } = useQuery(GET_PROJECT_COMPARISON, {
    variables: { projectId, compareWithId },
    skip: !projectId || !compareWithId,
  });

  const comparison = data?.projectComparison;

  if (loadingList) {
    return <div className="comparison-loading">Loading comparison options...</div>;
  }

  if (options.length === 0) {
    return (
      <div className="project-comparison-container">
        <div className="comparison-header">
          <h3>Project Comparison</h3>
        </div>
        <p className="comparison-empty">Create another project to start comparing performance.</p>
      </div>
    );
  }

  return (
    <div className="project-comparison-container">
      <div className="comparison-header">
        <div>
          <h3>Project Comparison</h3>
          <p>Compare this project against another project you own.</p>
        </div>
        <div className="comparison-controls">
          <select
            value={compareWithId}
            onChange={(e) => setCompareWithId(e.target.value)}
            className="comparison-select"
          >
            {options.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => refetch()} disabled={loading || !compareWithId}>
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="comparison-error">{error.message}</p>}

      {!error && loading && <p className="comparison-loading">Generating comparison...</p>}

      {!error && comparison && (
        <>
          <div className="comparison-overview">
            <div className="overview-card">
              <span className="overview-label">Current Project</span>
              <strong>{comparison.currentProject?.name}</strong>
              <span>Score: {scoreText(comparison.currentOverallScore)}</span>
              <span>Grade: {comparison.currentGrade || '--'}</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Compared Project</span>
              <strong>{comparison.otherProject?.name}</strong>
              <span>Score: {scoreText(comparison.otherOverallScore)}</span>
              <span>Grade: {comparison.otherGrade || '--'}</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Result</span>
              <strong>{comparison.betterProjectName || 'N/A'}</strong>
              <span className={`delta ${deltaClass(comparison.overallDelta)}`}>
                Delta: {comparison.overallDelta === null || comparison.overallDelta === undefined
                  ? '--'
                  : `${comparison.overallDelta > 0 ? '+' : ''}${comparison.overallDelta.toFixed(2)}`}
              </span>
              <span>{comparison.message}</span>
            </div>
          </div>

          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Metric</th>
                  <th>Current</th>
                  <th>Other</th>
                  <th>Delta</th>
                  <th>Leader</th>
                </tr>
              </thead>
              <tbody>
                {comparison.comparedDimensions.map((row) => (
                  <tr key={row.dimension}>
                    <td>{row.dimension}</td>
                    <td>{row.metricName}</td>
                    <td>{scoreText(row.currentScore)}</td>
                    <td>{scoreText(row.otherScore)}</td>
                    <td className={`delta ${deltaClass(row.delta)}`}>
                      {row.delta === null || row.delta === undefined
                        ? '--'
                        : `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(2)}`}
                    </td>
                    <td>{row.winner}</td>
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

export default ProjectComparison;
