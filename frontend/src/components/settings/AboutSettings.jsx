import React from 'react';

export default function AboutSettings() {
  return (
    <div>
      <div className="settings-section">
        <h2>About AI Project Analyser</h2>
        <p className="subtitle">Learn more about our platform</p>

        <div className="settings-info-card">
          <h3>Our Mission</h3>
          <p>
            AI Project Analyser is a cutting-edge platform designed to help developers and teams 
            analyze, optimize, and improve their software projects using advanced AI-powered insights. 
            We believe in making code quality assessment accessible, actionable, and automated.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>Key Features</h3>
          <ul className="settings-list-compact">
            <li><strong>Automated Code Analysis:</strong> Deep dive into your codebase with AI-powered metrics</li>
            <li><strong>Quality Scoring:</strong> Get comprehensive quality scores across multiple dimensions</li>
            <li><strong>Project Comparison:</strong> Compare multiple projects side-by-side</li>
            <li><strong>AI Chatbot:</strong> Ask questions about your code and get instant answers</li>
            <li><strong>Detailed Reports:</strong> Generate comprehensive analysis reports</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>Version Information</h3>
          <p>
            <strong>Version:</strong> 1.0.0<br/>
            <strong>Release Date:</strong> March 2026<br/>
            <strong>Build:</strong> Production
          </p>
        </div>

        <div className="settings-info-card">
          <h3>Technology Stack</h3>
          <p>
            <strong>Frontend:</strong> React 19, Vite, Apollo Client, Framer Motion<br/>
            <strong>Backend:</strong> Django, GraphQL, Celery<br/>
            <strong>AI/ML:</strong> Python, TensorFlow, Natural Language Processing<br/>
            <strong>Infrastructure:</strong> Docker, PostgreSQL, Redis
          </p>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Credits & Acknowledgments</h2>
        <p className="subtitle">Built with love by our team</p>

        <div className="settings-info-card">
          <p>
            We'd like to thank the open-source community and all the amazing libraries 
            and tools that made this platform possible. Special thanks to our beta testers 
            and early adopters who helped shape the product.
          </p>
        </div>
      </div>
    </div>
  );
}
