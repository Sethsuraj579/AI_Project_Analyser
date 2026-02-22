import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import PaymentForm from './PaymentForm';
import './PricingPlans.css';

const GET_PLANS = gql`
  query GetPlans {
    allPlans {
      id
      name
      description
      maxProjects
      maxAnalysesPerMonth
      pricePerMonth
      features
    }
  }
`;

const UPGRADE_PLAN = gql`
  mutation UpgradePlan($planName: String!) {
    upgradePlan(planName: $planName) {
      subscription {
        id
        plan {
          name
        }
        projectsUsed
        analysesUsed
      }
      success
      message
    }
  }
`;

export default function PricingPlans({ onSelectPlan, currentPlan }) {
  const { data, loading, error } = useQuery(GET_PLANS);
  const [upgradePlan] = useMutation(UPGRADE_PLAN);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || 'free');
  const [paymentModal, setPaymentModal] = useState({ open: false, plan: null });

  const handleSelectPlan = async (plan) => {
    // Free plan doesn't need payment
    if (plan.name === 'free' || plan.pricePerMonth === '0' || plan.pricePerMonth === 0) {
      try {
        const result = await upgradePlan({
          variables: { planName: plan.name },
        });

        if (result.data.upgradePlan.success) {
          setSelectedPlan(plan.name);
          if (onSelectPlan) {
            onSelectPlan(plan.name);
          }
          alert(result.data.upgradePlan.message);
        } else {
          alert('Error: ' + result.data.upgradePlan.message);
        }
      } catch (err) {
        console.error('Error upgrading plan:', err);
        alert('Failed to upgrade plan');
      }
    } else {
      // Show payment form for paid plans
      setPaymentModal({ open: true, plan });
    }
  };

  const handlePaymentSuccess = (payment) => {
    setSelectedPlan(paymentModal.plan.name);
    if (onSelectPlan) {
      onSelectPlan(paymentModal.plan.name);
    }
    setPaymentModal({ open: false, plan: null });
    alert(`Successfully upgraded to ${paymentModal.plan.name} plan!`);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  };

  if (loading) return <div className="pricing-container">Loading plans...</div>;
  if (error) return <div className="pricing-container">Error loading plans</div>;

  const plans = data?.allPlans || [];

  return (
    <>
      <div className="pricing-container">
        <div className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p>Flexible pricing for projects of any size</p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.name} ${
                selectedPlan === plan.name ? 'active' : ''
              }`}
            >
              <div className="plan-badge">{plan.name.toUpperCase()}</div>
              <h2>{plan.description}</h2>

              <div className="price">
                {plan.pricePerMonth === '0' || plan.pricePerMonth === 0 ? (
                  <span className="free">FREE</span>
                ) : (
                  <>
                    <span className="amount">INR {plan.pricePerMonth}</span>
                    <span className="period">/month</span>
                  </>
                )}
              </div>

              <div className="plan-limits">
                <div className="limit">
                  📁 <strong>{plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects}</strong> Projects
                </div>
                <div className="limit">
                  📊 <strong>{plan.maxAnalysesPerMonth === -1 ? 'Unlimited' : plan.maxAnalysesPerMonth}</strong> Analyses/Month
                </div>
              </div>

              <div className="features">
                <h3>Features Included:</h3>
                <ul>
                  {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              </div>

              <button
                className={`select-btn ${selectedPlan === plan.name ? 'current' : ''}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={selectedPlan === plan.name}
              >
                {selectedPlan === plan.name ? '✓ Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal.open && (
        <div className="payment-modal-overlay">
          <div className="payment-modal-content">
            <button
              className="modal-close-btn"
              onClick={() => setPaymentModal({ open: false, plan: null })}
              aria-label="Close payment modal"
            >
              ✕
            </button>
            <PaymentForm
              plan={paymentModal.plan}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </>
  );
}

