import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import './ProjectReportDownload.css';

const GET_CURRENT_SUBSCRIPTION = gql`
  query GetCurrentSubscription {
    mySubscription {
      id
      plan {
        name
      }
    }
  }
`;

function ProjectReportDownload({ projectId, projectName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { data: userData } = useQuery(GET_CURRENT_SUBSCRIPTION);

  const userPlan = userData?.mySubscription?.plan?.name?.toLowerCase() || 'free';
  const hasAccess = userPlan === 'basic' || userPlan === 'premium';

  const getReportUrl = () => {
    const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8000/graphql/';
    const apiBase = graphqlUrl.replace(/\/graphql\/?$/, '/');
    return `${apiBase}api/projects/${projectId}/report/pdf/`;
  };

  const handleDownload = async () => {
    setError('');
    setIsDownloading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(getReportUrl(), {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upgrade to Basic or Premium plan to access PDF reports.');
        }
        throw new Error('Unable to download report. Please run analysis and try again.');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${(projectName || 'project').replace(/\s+/g, '-').toLowerCase()}-analysis-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError.message || 'Download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="report-download-card">
      <div className="report-download-header">
        <h3>📄 Professional Project Report</h3>
        <p>Download a complete PDF with narrative report sections and chart-based visual insights.</p>
      </div>

      <ul className="report-feature-list">
        <li>Executive summary and project details</li>
        <li>Dimension-wise metric table</li>
        <li>Pictorial analysis charts in the same document</li>
        <li>Branded professional format</li>
      </ul>

      {hasAccess ? (
        <button
          className="report-download-btn"
          onClick={handleDownload}
          disabled={isDownloading || !projectId}
          type="button"
        >
          {isDownloading ? 'Preparing PDF...' : 'Download PDF Report'}
        </button>
      ) : (
        <div className="upgrade-prompt">
          <p className="upgrade-message">
            🔒 PDF reports are available for <strong>Basic</strong> and <strong>Premium</strong> subscribers
          </p>
          <button
            className="upgrade-btn"
            onClick={() => navigate('/pricing')}
            type="button"
          >
            Upgrade to Access
          </button>
        </div>
      )}

      {error ? <p className="report-download-error">{error}</p> : null}
    </div>
  );
}

export default ProjectReportDownload;
