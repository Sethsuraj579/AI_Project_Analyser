import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import './Landing.css';

const METRIC_TARGETS = {
  signals: 10,
  reports: 100,
  workflow: 4,
  setup: 5,
};

function Landing() {
  const metricsRef = useRef(null);
  const [startCount, setStartCount] = useState(false);
  const [counts, setCounts] = useState({
    signals: 0,
    reports: 0,
    workflow: 0,
    setup: 0,
  });

  useEffect(() => {
    const node = metricsRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setStartCount(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!startCount) return undefined;

    const durationMs = 1100;
    const start = performance.now();

    let rafId;
    const animate = (now) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        signals: Math.round(METRIC_TARGETS.signals * eased),
        reports: Math.round(METRIC_TARGETS.reports * eased),
        workflow: Math.round(METRIC_TARGETS.workflow * eased),
        setup: Math.round(METRIC_TARGETS.setup * eased),
      });

      if (progress < 1) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    rafId = window.requestAnimationFrame(animate);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [startCount]);

  return (
    <div className="landing-page">
      <div className="landing-ambient landing-ambient-left" aria-hidden="true" />
      <div className="landing-ambient landing-ambient-right" aria-hidden="true" />

      <header className="landing-topbar">
        <div className="landing-brand">
          <span className="landing-brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <div>
            <h1>AIProject Analyzer</h1>
            <p>Precision analytics for software quality teams</p>
          </div>
        </div>
        <nav className="landing-nav">
          <Link to="/pricing">Pricing</Link>
          <Link className="landing-nav-login" to="/login">Login</Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-kicker">Engineering Intelligence Platform</p>
          <h2>Ship better software with project-level quality scoring and AI insights.</h2>
          <p className="landing-subtext">
            Track quality trends, compare projects, generate visual reports, and turn static metrics into clear actions.
          </p>
          <div className="landing-cta-row">
            <Link className="landing-btn landing-btn-primary" to="/pricing">Get Started Free</Link>
            <Link className="landing-btn landing-btn-ghost" to="/login">Sign In</Link>
          </div>
        </section>

        <section className="landing-grid" aria-label="Platform highlights">
          <article className="landing-card">
            <h3>Automated Analysis Runs</h3>
            <p>Measure code health dimensions across frontend, backend, and data layers in a single workflow.</p>
          </article>
          <article className="landing-card">
            <h3>Visual Project Reports</h3>
            <p>Export branded PDF reports with trend charts and dimensional score tables for stakeholders.</p>
          </article>
          <article className="landing-card">
            <h3>Growth-Ready Plans</h3>
            <p>Start on Free, upgrade to Basic or Premium as your analysis volume and team footprint grows.</p>
          </article>
        </section>

        <section className="landing-metrics" aria-label="Why choose us" ref={metricsRef}>
          <div className="landing-metrics-head">
            <p className="landing-kicker">Why Choose Us</p>
            <h3>Built for reliable quality decisions</h3>
          </div>
          <div className="landing-metrics-grid">
            <article className="landing-metric-card">
              <span className="landing-metric-value">{counts.signals}+</span>
              <strong>Quality Signals</strong>
              <p>Dimension-based scoring across performance, maintainability, reliability, and scalability.</p>
            </article>
            <article className="landing-metric-card">
              <span className="landing-metric-value">{counts.reports}%</span>
              <strong>Visual Reporting Coverage</strong>
              <p>Share polished reports with charts, grades, and executive summaries in one click.</p>
            </article>
            <article className="landing-metric-card">
              <span className="landing-metric-value">{counts.workflow} Steps</span>
              <strong>End-to-End Workflow</strong>
              <p>Create projects, run analysis, compare results, and improve with AI-backed insights.</p>
            </article>
            <article className="landing-metric-card">
              <span className="landing-metric-value">~{counts.setup} Min</span>
              <strong>Average Setup Time</strong>
              <p>Start in minutes with Free plan access and smoothly upgrade as your team scales.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p>AIProject Analyzer © 2026</p>
          <div className="landing-footer-links">
            <Link to="/pricing">Plans</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
