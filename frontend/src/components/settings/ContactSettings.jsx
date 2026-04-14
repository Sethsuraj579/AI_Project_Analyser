import React, { useState } from 'react';

export default function ContactSettings() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div>
      <div className="settings-section">
        <h2>Contact Us</h2>
        <p className="subtitle">Get in touch with our support team</p>

        {submitted && (
          <div className="settings-info-card settings-callout success">
            <p>Thank you for contacting us. We’ll get back to you within 24-48 hours.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="settings-form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a subject...</option>
              <option value="technical">Technical Support</option>
              <option value="billing">Billing Question</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="general">General Inquiry</option>
            </select>
          </div>

          <div className="settings-form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="6"
              required
            />
          </div>

          <div className="settings-btn-group">
            <button type="submit" className="settings-btn settings-btn-primary">
              Send Message
            </button>
          </div>
        </form>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Other Ways to Reach Us</h2>
        <p className="subtitle">Choose your preferred contact method</p>

        <div className="settings-info-card">
          <h3>Email Support</h3>
          <p>
            <strong>General:</strong> support@aiprojectanalyser.com<br/>
            <strong>Technical:</strong> tech@aiprojectanalyser.com<br/>
            <strong>Billing:</strong> billing@aiprojectanalyser.com
          </p>
        </div>

        <div className="settings-info-card">
          <h3>Live Chat</h3>
          <p>
            Available Monday - Friday, 9 AM - 6 PM EST<br/>
            <button className="settings-btn settings-btn-secondary settings-card-actions">
              Start Chat
            </button>
          </p>
        </div>

        <div className="settings-info-card">
          <h3>Social Media</h3>
          <p>
            Follow us on Twitter, LinkedIn, and GitHub for updates and announcements.
          </p>
        </div>
      </div>
    </div>
  );
}
