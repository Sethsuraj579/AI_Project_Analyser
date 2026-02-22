import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_PROJECT_SUMMARY, GENERATE_PROJECT_SUMMARY } from '../graphql/queries';

/**
 * Component to display and generate AI-powered project summary
 */
function ProjectSummary({ projectId }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PROJECT_SUMMARY, {
    variables: { projectId },
    skip: !projectId,
  });

  const [generateSummary] = useMutation(GENERATE_PROJECT_SUMMARY, {
    onCompleted: (data) => {
      setIsGenerating(false);
      if (data.generateProjectSummary.success) {
        // Refetch after a delay to get the generated summary
        setTimeout(() => refetch(), 2000);
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Project Summary</h3>
        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating || loading}
          style={{
            ...styles.button,
            opacity: isGenerating || loading ? 0.5 : 1,
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate AI Summary'}
        </button>
      </div>

      <div style={styles.content}>
        {loading ? (
          <p style={styles.loading}>Loading...</p>
        ) : summary ? (
          <p style={styles.summaryText}>{summary}</p>
        ) : (
          <div style={styles.emptyState}>
            <p>No summary yet</p>
            <p style={styles.emptyHint}>Click "Generate AI Summary" to create one</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0f1419',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#00d4ff',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  content: {
    padding: '16px',
    minHeight: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    margin: 0,
    color: '#fff',
    lineHeight: '1.6',
    fontSize: '14px',
  },
  loading: {
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyHint: {
    fontSize: '12px',
    marginTop: '8px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
};

export default ProjectSummary;
