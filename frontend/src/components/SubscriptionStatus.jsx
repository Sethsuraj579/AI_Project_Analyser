import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import './SubscriptionStatus.css';

const GET_SUBSCRIPTION = gql`
  query GetSubscription {
    mySubscription {
      id
      plan {
        id
        name
        maxProjects
        maxAnalysesPerMonth
      }
      projectsUsed
      analysesUsed
      renewsAt
      isPlanExpired
      canCreateProject
      canRunAnalysis
    }
  }
`;

export default function SubscriptionStatus() {
  const { data, loading, error } = useQuery(GET_SUBSCRIPTION, {
    pollInterval: 60000, // Refresh every minute
  });

  if (loading) return <div className="subscription-status loading">Loading...</div>;
  if (error) return <div className="subscription-status error">Error loading subscription</div>;

  const subscription = data?.mySubscription;
  if (!subscription || !subscription.plan) {
    return <div className="subscription-status">No active subscription</div>;
  }

  const plan = subscription.plan;
  const projectsUsed = subscription.projectsUsed || 0;
  const analysesUsed = subscription.analysesUsed || 0;
  const maxProjects = plan.maxProjects === -1 ? '∞' : plan.maxProjects;
  const maxAnalyses = plan.maxAnalysesPerMonth === -1 ? '∞' : plan.maxAnalysesPerMonth;

  const projectsPercentage = plan.maxProjects === -1 ? 0 : (projectsUsed / plan.maxProjects) * 100;
  const analysesPercentage = plan.maxAnalysesPerMonth === -1 ? 0 : (analysesUsed / plan.maxAnalysesPerMonth) * 100;

  const planColor = {
    free: '#10b981',
    basic: '#3b82f6',
    premium: '#fbbf24',
  };

  const renewDate = subscription.renewsAt
    ? new Date(subscription.renewsAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="subscription-status">
      <div className="subscription-header">
        <div className="plan-info">
          <h3>Your Current Plan</h3>
          <div className="plan-badge" style={{ backgroundColor: planColor[plan.name] }}>
            {plan.name.toUpperCase()}
          </div>
        </div>

        {subscription.isPlanExpired && (
          <div className="warning-banner">
            ⚠️ Your subscription has expired. Renew to continue!
          </div>
        )}
      </div>

      <div className="usage-section">
        <div className="usage-item">
          <div className="usage-label">
            <span>Projects</span>
            <span className="usage-count">
              {projectsUsed} / {maxProjects}
            </span>
          </div>
          {plan.maxProjects !== -1 && (
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{
                  width: `${Math.min(projectsPercentage, 100)}%`,
                  backgroundColor: projectsPercentage > 80 ? '#ef4444' : '#4f46e5',
                }}
              />
            </div>
          )}
          {!subscription.canCreateProject && (
            <div className="usage-warning">Project limit reached</div>
          )}
        </div>

        <div className="usage-item">
          <div className="usage-label">
            <span>Analyses This Month</span>
            <span className="usage-count">
              {analysesUsed} / {maxAnalyses}
            </span>
          </div>
          {plan.maxAnalysesPerMonth !== -1 && (
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{
                  width: `${Math.min(analysesPercentage, 100)}%`,
                  backgroundColor: analysesPercentage > 80 ? '#ef4444' : '#4f46e5',
                }}
              />
            </div>
          )}
          {!subscription.canRunAnalysis && (
            <div className="usage-warning">Analysis limit reached for this month</div>
          )}
        </div>
      </div>

      {renewDate && plan.name === 'basic' && (
        <div className="renewal-info">
          📅 Basic plan renews on: <strong>{renewDate}</strong>
        </div>
      )}

      <div className="plan-actions">
        <a href="/pricing" className="upgrade-link">
          View All Plans
        </a>
      </div>
    </div>
  );
}
