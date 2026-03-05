import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'How do I upload a project for analysis?',
    answer: 'Click on "+ New Project" in the navigation bar, enter your GitHub repository URL, and click "Analyze". Our AI will process your code and provide detailed insights within minutes.'
  },
  {
    question: 'What programming languages are supported?',
    answer: 'We currently support Python, JavaScript, TypeScript, Java, C++, C#, Ruby, Go, PHP, and many more. Our AI adapts to different languages and frameworks automatically.'
  },
  {
    question: 'How is my code quality score calculated?',
    answer: 'Your code quality score is based on multiple dimensions including maintainability, complexity, documentation, security, performance, and best practices. Each dimension is weighted and combined to produce an overall score.'
  },
  {
    question: 'Can I compare multiple projects?',
    answer: 'Yes! Go to the "Comparison" page and select the projects you want to compare. You\'ll see side-by-side metrics, charts, and insights to help you understand differences.'
  },
  {
    question: 'How does the AI chatbot work?',
    answer: 'The chatbot uses natural language processing to understand your questions about your code. It has context about your project and can answer questions about specific files, functions, or general code quality.'
  },
  {
    question: 'What are the subscription limits?',
    answer: 'Free tier allows 3 projects. Pro tier ($19/month) allows 20 projects. Enterprise tier ($49/month) provides unlimited projects. Check the Pricing page for detailed features.'
  },
  {
    question: 'Is my code kept private?',
    answer: 'Absolutely! Your code is encrypted, never shared with third parties, and never used to train public models. You can delete your projects at any time. See our Privacy Policy for details.'
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings > Subscription and click "Manage Subscription". You can cancel anytime and your access will continue until the end of your billing period.'
  }
];

export default function HelpSettings() {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFAQs = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="settings-section">
        <h2>Help Center</h2>
        <p className="subtitle">Find answers to common questions</p>

        <div className="settings-form-group">
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: '24px' }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          {filteredFAQs.map((item, index) => (
            <div
              key={index}
              className="settings-info-card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: expandedIndex === index ? '4px solid var(--accent)' : '4px solid transparent'
              }}
              onClick={() => toggleFAQ(index)}
            >
              <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.question}
                <span style={{ fontSize: '1.2rem' }}>{expandedIndex === index ? '−' : '+'}</span>
              </h3>
              {expandedIndex === index && (
                <p style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  {item.answer}
                </p>
              )}
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="settings-info-card">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No results found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Quick Start Guide</h2>
        <p className="subtitle">Get started in 3 easy steps</p>

        <div className="settings-info-card">
          <h3>1️⃣ Create a Project</h3>
          <p>
            Click "+ New Project" and paste your GitHub repository URL. Our AI will clone and analyze 
            your code automatically.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>2️⃣ Review Insights</h3>
          <p>
            Explore the dashboard to see your project's quality score, dimension breakdowns, charts, 
            and detailed metrics. Click on any metric to learn more.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>3️⃣ Chat with AI</h3>
          <p>
            Use the chatbot to ask questions about your code. Try asking "What can I improve?" or 
            "Explain the authentication module".
          </p>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Video Tutorials</h2>
        <p className="subtitle">Learn by watching</p>

        <div className="settings-info-card">
          <h3>📺 Getting Started with AI Project Analyser</h3>
          <p>A comprehensive 5-minute tutorial covering account setup, project creation, and basic features.</p>
          <button className="settings-btn settings-btn-secondary" style={{ marginTop: '12px' }}>
            Watch Video
          </button>
        </div>

        <div className="settings-info-card">
          <h3>📺 Understanding Quality Metrics</h3>
          <p>Deep dive into how we calculate quality scores and what each metric means for your project.</p>
          <button className="settings-btn settings-btn-secondary" style={{ marginTop: '12px' }}>
            Watch Video
          </button>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Still Need Help?</h2>
        <p className="subtitle">We're here to assist you</p>

        <div className="settings-info-card">
          <p>
            Can't find what you're looking for? Our support team is ready to help!
          </p>
          <div className="settings-btn-group" style={{ marginTop: '16px' }}>
            <button className="settings-btn settings-btn-primary">
              Contact Support
            </button>
            <button className="settings-btn settings-btn-secondary">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
