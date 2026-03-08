import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { gsap } from 'gsap';
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

const FALLBACK_PLANS = [
  {
    id: 'fallback-free',
    name: 'FREE',
    description: 'Get started with basic analysis',
    maxProjects: 5,
    maxAnalysesPerMonth: -1,
    pricePerMonth: '0.00',
    features: [
      'Up to 5 projects',
      'Basic analysis',
      'Email support',
      'Standard metrics',
    ],
  },
  {
    id: 'fallback-basic',
    name: 'BASIC',
    description: 'Perfect for growing teams',
    maxProjects: 20,
    maxAnalysesPerMonth: -1,
    pricePerMonth: '29.00',
    features: [
      'Up to 20 projects',
      'Unlimited analyses',
      '30-day project reports',
      'PDF report download',
      'Priority email support',
      'Advanced metrics',
      'Trend analysis',
      'Custom thresholds',
    ],
  },
  {
    id: 'fallback-premium',
    name: 'PREMIUM',
    description: 'For power users and enterprises',
    maxProjects: -1,
    maxAnalysesPerMonth: -1,
    pricePerMonth: '99.00',
    features: [
      'Unlimited projects',
      'Unlimited analyses',
      'Unlimited reports',
      'PDF report download',
      '24/7 priority support',
      'All metrics & features',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced analytics',
      'Webhooks',
    ],
  },
];

export default function PricingPlans({ onSelectPlan, currentPlan }) {
  const { data, loading, error } = useQuery(GET_PLANS);
  const [upgradePlan] = useMutation(UPGRADE_PLAN);
  const [selectedPlan, setSelectedPlan] = useState((currentPlan || 'free').toLowerCase());
  const [paymentModal, setPaymentModal] = useState({ open: false, plan: null });
  const cardsRef = useRef([]);
  const headerRef = useRef(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('PricingPlans Query State:', { loading, error, data });
  }, [loading, error, data]);

  const handleSelectPlan = async (plan) => {
    const normalizedName = (plan?.name || '').toLowerCase();

    // Free plan doesn't need payment
    if (normalizedName === 'free' || plan.pricePerMonth === '0' || plan.pricePerMonth === 0 || plan.pricePerMonth === '0.00') {
      try {
        const result = await upgradePlan({
          variables: { planName: normalizedName },
        });

        if (result.data.upgradePlan.success) {
          setSelectedPlan(normalizedName);
          if (onSelectPlan) {
            onSelectPlan(normalizedName);
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
    const normalizedName = (paymentModal.plan?.name || '').toLowerCase();
    setSelectedPlan(normalizedName);
    if (onSelectPlan) {
      onSelectPlan(normalizedName);
    }
    setPaymentModal({ open: false, plan: null });
    alert(`Successfully upgraded to ${normalizedName} plan!`);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  };

  // GSAP animations on mount
  useEffect(() => {
    const validCards = cardsRef.current.filter(Boolean);
    if (data?.allPlans && headerRef.current && validCards.length > 0) {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );

      // Cards stagger animation
      gsap.fromTo(
        validCards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'back.out(1.7)',
        }
      );
    }
  }, [data]);

  // Hover animations with GSAP
  const handleCardHover = (index, isEntering) => {
    const card = cardsRef.current[index];
    if (!card) return;

    if (isEntering) {
      setHoveredCard(index);
      gsap.to(card, {
        scale: 1.05,
        rotateY: 5,
        z: 50,
        boxShadow: '0 20px 60px rgba(79, 70, 229, 0.4)',
        duration: 0.3,
        ease: 'power2.out',
      });
      
      // Animate features list
      const features = card.querySelectorAll('.features li');
      gsap.fromTo(
        features,
        { x: -10, opacity: 0.5 },
        { x: 0, opacity: 1, duration: 0.2, stagger: 0.05 }
      );
    } else {
      setHoveredCard(null);
      gsap.to(card, {
        scale: 1,
        rotateY: 0,
        z: 0,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.inOut',
      });
    }
  };

  const sourcePlans = data?.allPlans?.length ? data.allPlans : FALLBACK_PLANS;

  const plans = sourcePlans.map((plan) => {
    const normalizedName = (plan?.name || '').toLowerCase();
    let normalizedFeatures = plan?.features;

    if (typeof normalizedFeatures === 'string') {
      try {
        normalizedFeatures = JSON.parse(normalizedFeatures);
      } catch {
        normalizedFeatures = [];
      }
    }

    return {
      ...plan,
      normalizedName,
      normalizedFeatures: Array.isArray(normalizedFeatures) ? normalizedFeatures : [],
    };
  });



  if (plans.length === 0) {
    return <div className="pricing-container"><p style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>No plans configured yet</p></div>;
  }

  return (
    <>
      <div className="pricing-container">
        {loading && (
          <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '16px' }}>
            Loading plans from server...
          </p>
        )}
        {error && (
          <p style={{ color: '#fbbf24', textAlign: 'center', marginBottom: '16px' }}>
            Showing default plans while server data is unavailable.
          </p>
        )}
        <div className="pricing-header" ref={headerRef}>
          <h1>Choose Your Plan</h1>
          <p>Flexible pricing for projects of any size</p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              ref={(el) => (cardsRef.current[index] = el)}
              className={`pricing-card ${plan.normalizedName} ${
                selectedPlan === plan.normalizedName ? 'active' : ''
              }`}
              onMouseEnter={() => handleCardHover(index, true)}
              onMouseLeave={() => handleCardHover(index, false)}
            >
              <div className="plan-badge">
                {plan.normalizedName === 'basic' ? '⭐ MOST POPULAR' : plan.name}
              </div>
              <h2>{plan.description}</h2>

              <div className="price">
                {plan.pricePerMonth === '0' || plan.pricePerMonth === 0 ? (
                  <span className="free">FREE</span>
                ) : (
                  <>
                    <span className="amount">₹{plan.pricePerMonth}</span>
                    <span className="period">/month</span>
                  </>
                )}
              </div>

              <div className="plan-limits">
                <div className="limit">
                  <strong>{plan.maxProjects === -1 ? '∞' : plan.maxProjects}</strong>
                  <span>Projects</span>
                </div>
                <div className="limit">
                  <strong>{plan.maxAnalysesPerMonth === -1 ? '∞' : plan.maxAnalysesPerMonth}</strong>
                  <span>Analyses</span>
                </div>
              </div>

              <div className="features">
                <h3>What's Included</h3>
                <ul>
                  {plan.normalizedFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              <button
                className={`select-btn ${selectedPlan === plan.normalizedName ? 'current' : ''}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={selectedPlan === plan.normalizedName}
              >
                {selectedPlan === plan.normalizedName ? '✓ Current Plan' : 'Get Started'}
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

