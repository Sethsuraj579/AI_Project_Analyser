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
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No billing history available
          </p>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Payment Methods</h2>
        <p className="subtitle">Manage your payment methods</p>

        <div className="settings-info-card">
          <h3>💳 Credit/Debit Card</h3>
          <p>Add or update your payment method for automatic subscription renewals</p>
        </div>

        <div className="settings-btn-group">
          <button className="settings-btn settings-btn-secondary">
            Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
