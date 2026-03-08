import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PricingPlans from '../components/PricingPlans';
import SubscriptionStatus from '../components/SubscriptionStatus';
import './Pricing.css';

export default function Pricing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

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
      icon: "🚀",
      title: "Lightning Fast Analysis",
      description: "Get comprehensive project insights in seconds with our optimized ML engine"
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      description: "Bank-grade encryption and secure data handling for all your projects"
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Deep code metrics, trend analysis, and actionable recommendations"
    },
    {
      icon: "🎯",
      title: "Custom Thresholds",
      description: "Set your own quality standards and get tailored insights"
    },
    {
      icon: "📄",
      title: "PDF Reports",
      description: "Professional downloadable reports with charts and detailed analysis"
    },
    {
      icon: "💬",
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
          <div className="hero-badge">💎 Simple, Transparent Pricing</div>
          <h1 className="hero-title">Choose the Perfect Plan for Your Team</h1>
          <p className="hero-subtitle">
            Start for free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </section>

        {/* Subscription Status */}
        <SubscriptionStatus />
        
        {/* Pricing Plans */}
        <PricingPlans onSelectPlan={handleSelectPlan} />

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
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
