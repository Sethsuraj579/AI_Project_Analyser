import React from 'react';
import { useNavigate } from 'react-router-dom';
import PricingPlans from '../components/PricingPlans';
import SubscriptionStatus from '../components/SubscriptionStatus';
import './Pricing.css';

export default function Pricing() {
  const navigate = useNavigate();

  const handleSelectPlan = (planName) => {
    // Give user a moment to see the success message, then redirect
    setTimeout(() => {
      navigate('/projects');
    }, 2000);
  };

  return (
    <div className="pricing-page">
      <div className="pricing-nav">
        <button
          className="back-btn"
          onClick={() => navigate('/projects')}
        >
          ← Back to Projects
        </button>
      </div>

      <SubscriptionStatus />
      <PricingPlans onSelectPlan={handleSelectPlan} />
    </div>
  );
}
