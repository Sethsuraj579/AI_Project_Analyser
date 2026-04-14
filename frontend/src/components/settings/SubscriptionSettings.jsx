import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionStatus from '../SubscriptionStatus';
import PricingPlans from '../PricingPlans';

export default function SubscriptionSettings() {
  const navigate = useNavigate();

  const handleSelectPlan = (planName) => {
    // Handled by PricingPlans component
  };

  return (
    <div>
      <div className="settings-section">
        <h2>Subscription & Billing</h2>
        <p className="subtitle">Manage your subscription plan and billing information</p>

        <SubscriptionStatus />
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Available Plans</h2>
        <p className="subtitle">Upgrade or downgrade your subscription</p>

        <PricingPlans onSelectPlan={handleSelectPlan} />
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Billing History</h2>
        <p className="subtitle">View your past invoices and payments</p>

        <div className="settings-info-card">
          <p className="settings-empty-note">
            No billing history available
          </p>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Payment Methods</h2>
        <p className="subtitle">How payment methods work for paid plans</p>

        <div className="settings-info-card">
          <h3>Payment Guidance</h3>
          <p>
            Payment methods are added during subscription purchase and are only required for
            <strong> Pro</strong> and <strong>Enterprise</strong> plans.
          </p>
          <p>
            Your payment details are securely stored and processed by Razorpay for safe recurring
            billing.
          </p>
        </div>

        <div className="settings-btn-group">
          <button
            className="settings-btn settings-btn-secondary"
            onClick={() => navigate('/pricing')}
          >
            Update Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
