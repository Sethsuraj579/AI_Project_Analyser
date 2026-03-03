import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_PROJECT_SUMMARY, GENERATE_PROJECT_SUMMARY } from '../graphql/queries';
import './ProjectSummary.css';

/**
 * Component to display and generate AI-powered project summary
 */
function ProjectSummary({ projectId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PROJECT_SUMMARY, {
    variables: { projectId },
    skip: !projectId,
  });

  const [generateSummary] = useMutation(GENERATE_PROJECT_SUMMARY, {
    onCompleted: (data) => {
      setIsGenerating(false);
      if (data.generateProjectSummary.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setTimeout(() => refetch(), 1500);
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error('Error generating summary:', error);
    },
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      await generateSummary({
        variables: { projectId },
      });
    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
    }
  };

  const summary = data?.project?.summary?.summary;

  const renderSkeletonLoader = () => (
    <div className="skeleton-loader">
      <div className="skeleton-line skeleton-line-1"></div>
      <div className="skeleton-line skeleton-line-2"></div>
      <div className="skeleton-line skeleton-line-3"></div>
    </div>
  );

  return (
    <div className="project-summary-container">
      <div className="summary-header">
        <div className="summary-header-content">
          <h3 className="summary-title">✨ Project Summary</h3>
          <p className="summary-subtitle">AI-generated project overview</p>
        </div>
        <button
          className={`summary-btn generate-btn ${isGenerating ? 'loading' : ''} ${showSuccess ? 'success' : ''}`}
          onClick={handleGenerateSummary}
          disabled={isGenerating || loading}
          title="Generate a new AI summary"
        >
          {showSuccess ? (
            <>
              <span className="btn-icon">✓</span>
              <span>Generated!</span>
            </>
          ) : isGenerating ? (
            <>
              <span className="btn-spinner"></span>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">⚡</span>
              <span>Generate Summary</span>
            </>
          )}
        </button>
      </div>

      <div className="summary-content">
        {loading ? (
          renderSkeletonLoader()
        ) : summary ? (
          <div className="summary-text-wrapper">
            <div className="summary-icon">📄</div>
            <p className="summary-text">{summary}</p>
          </div>
        ) : (
          <div className="summary-empty-state">
            <div className="empty-icon">📋</div>
            <h4>No Summary Yet</h4>
            <p>Click the button above to generate an AI-powered summary of your project</p>
            <div className="empty-features">
              <span className="feature-tag">🤖 AI Powered</span>
              <span className="feature-tag">⚡ Fast</span>
              <span className="feature-tag">✨ Accurate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectSummary;
