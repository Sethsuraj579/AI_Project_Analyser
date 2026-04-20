import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import PricingPlans from '../components/PricingPlans';
import SubscriptionStatus from '../components/SubscriptionStatus';
import './Pricing.css';

const GET_CURRENT_PLAN = gql`
  query GetCurrentPlan {
    mySubscription {
      plan {
        name
      }
    }
  }
`;

function PricingIcon({ name }) {
  if (name === 'speed') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13h7l2-7 2 12 2-5h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'security') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.8-3 7.8-7 9-4-1.2-7-4.2-7-9V6l7-3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === 'analytics') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19V9M12 19V5M19 19v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'thresholds') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14M5 12h14M5 18h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9" cy="6" r="1.8" fill="currentColor" />
        <circle cx="15" cy="12" r="1.8" fill="currentColor" />
        <circle cx="12" cy="18" r="1.8" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'reports') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l5 5v13H7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === 'support') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4a8 8 0 0 0-8 8v3h4l1-3h6l1 3h4v-3a8 8 0 0 0-8-8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return null;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const { data: subscriptionData } = useQuery(GET_CURRENT_PLAN);
  const currentPlan = subscriptionData?.mySubscription?.plan?.name || 'free';

  const highlights = [
    { label: 'Active Teams', value: '2.4k+' },
    { label: 'Avg Analysis Time', value: '34s' },
    { label: 'Plan Uptime', value: '99.9%' },
    { label: 'Support SLA', value: '< 2h' },
  ];

  const handleSelectPlan = (planName) => {
    // Give user a moment to see the success message, then redirect
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes! You can upgrade or downgrade your subscription plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, and net banking through our secure Razorpay payment gateway."
    },
    {
      question: "Is there a free trial period?",
      answer: "The Free plan is available indefinitely with no credit card required. You can upgrade to a paid plan whenever you need more features."
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer: "If you reach your project or analysis limits, you'll be prompted to upgrade to a higher tier. Your existing data remains safe and accessible."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 7-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Absolutely. You can cancel your subscription at any time from your account settings. You'll retain access until the end of your billing period."
    }
  ];

  const features = [
    {
      icon: 'speed',
      title: "Lightning Fast Analysis",
      description: "Get comprehensive project insights in seconds with our optimized ML engine"
    },
    {
      icon: 'security',
      title: "Enterprise Security",
      description: "Bank-grade encryption and secure data handling for all your projects"
    },
    {
      icon: 'analytics',
      title: "Advanced Analytics",
      description: "Deep code metrics, trend analysis, and actionable recommendations"
    },
    {
      icon: 'thresholds',
      title: "Custom Thresholds",
      description: "Set your own quality standards and get tailored insights"
    },
    {
      icon: 'reports',
      title: "PDF Reports",
      description: "Professional downloadable reports with charts and detailed analysis"
    },
    {
      icon: 'support',
      title: "Priority Support",
      description: "Get help when you need it with our dedicated support team"
    }
  ];

  return (
    <>
      <div className="pricing-page">
        <div className="pricing-nav">
          <button
            className="back-btn"
            onClick={() => navigate('/')}
          >
            <span className="back-arrow">←</span> Back to Dashboard
          </button>
        </div>

        {/* Hero Section */}
        <section className="pricing-hero">
          <div className="hero-badge">Simple, Transparent Pricing</div>
          <h1 className="hero-title">Choose the Perfect Plan for Your Team</h1>
          <p className="hero-subtitle">
            Start for free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>

          <div className="pricing-highlights">
            {highlights.map((item) => (
              <div className="highlight-item" key={item.label}>
                <span className="highlight-value">{item.value}</span>
                <span className="highlight-label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription Status */}
        <section className="pricing-panel-wrap">
          <div className="pricing-panel-head">
            <h2 className="section-title">Subscription Overview</h2>
            <p className="section-caption">Track current usage and renewals from one place.</p>
          </div>
          <SubscriptionStatus />
        </section>
        
        {/* Pricing Plans */}
        <section className="pricing-panel-wrap">
          <PricingPlans onSelectPlan={handleSelectPlan} currentPlan={currentPlan} />
        </section>

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon"><PricingIcon name={feature.icon} /></div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-subtitle">
              Join thousands of developers analyzing their projects with confidence
            </p>
            <button
              className="cta-button"
              onClick={() => {
                const plansSection = document.querySelector('.pricing-grid');
                plansSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              Choose Your Plan
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
