import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import AccountSettings from '../components/settings/AccountSettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import SubscriptionSettings from '../components/settings/SubscriptionSettings';
import AboutSettings from '../components/settings/AboutSettings';
import ContactSettings from '../components/settings/ContactSettings';
import TermsSettings from '../components/settings/TermsSettings';
import PrivacySettings from '../components/settings/PrivacySettings';
import HelpSettings from '../components/settings/HelpSettings';

const TABS = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'profile', label: 'Profile', icon: '📝' },
  { id: 'subscription', label: 'Subscription', icon: '💳' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
  { id: 'contact', label: 'Contact', icon: '📧' },
  { id: 'terms', label: 'Terms & Conditions', icon: '📜' },
  { id: 'privacy', label: 'Privacy Policy', icon: '🔒' },
  { id: 'help', label: 'Help', icon: '❓' }
];

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'subscription':
        return <SubscriptionSettings />;
      case 'about':
        return <AboutSettings />;
      case 'contact':
        return <ContactSettings />;
      case 'terms':
        return <TermsSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'help':
        return <HelpSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
        <h1>⚙️ Settings</h1>
      </div>

      <div className="settings-container">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="settings-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
