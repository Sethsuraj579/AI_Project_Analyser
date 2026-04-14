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
import IntegrationsSettings from '../components/settings/IntegrationsSettings';

function SettingsIcon({ name }) {
  if (name === 'account') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20c1.6-3.2 4.1-5 7-5s5.4 1.8 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'profile') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10l3 3v13H7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 11h7M10 15h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'subscription') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === 'integrations') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 7h4a3 3 0 0 1 0 6H8m8 4h-4a3 3 0 0 1 0-6h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'about') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 10v6M12 7h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'contact') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 8l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'terms') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10l3 3v13H7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 11h7M10 15h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'privacy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.8-3 7.8-7 9-4-1.2-7-4.2-7-9V6l7-3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === 'help') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.3 1-1.3 1.8v.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return null;
}

const TABS = [
  { 
    id: 'account', 
    label: 'Account', 
    icon: 'account',
    description: 'Security & authentication'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: 'profile',
    description: 'Personal information'
  },
  { 
    id: 'subscription', 
    label: 'Subscription', 
    icon: 'subscription',
    description: 'Plans & billing'
  },
  { 
    id: 'integrations',
    label: 'Integrations',
    icon: 'integrations',
    description: 'Webhooks & external tools',
    section: 'general',
  },
  {
    id: 'about', 
    label: 'About', 
    icon: 'about',
    description: 'App information',
    section: 'support',
  },
  { 
    id: 'contact', 
    label: 'Contact', 
    icon: 'contact',
    description: 'Get in touch',
    section: 'support',
  },
  { 
    id: 'terms', 
    label: 'Terms & Conditions', 
    icon: 'terms',
    description: 'Legal terms',
    section: 'support',
  },
  { 
    id: 'privacy', 
    label: 'Privacy Policy', 
    icon: 'privacy',
    description: 'Data & privacy',
    section: 'support',
  },
  { 
    id: 'help', 
    label: 'Help', 
    icon: 'help',
    description: 'Support & FAQs',
    section: 'support',
  }
];

TABS.forEach((tab) => {
  if (!tab.section) {
    tab.section = ['account', 'profile', 'subscription'].includes(tab.id) ? 'general' : 'support';
  }
});

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [searchQuery, setSearchQuery] = useState('');
  const visibleTabs = TABS.length;
  const generalTabs = TABS.filter((tab) => tab.section === 'general').length;
  const supportTabs = TABS.filter((tab) => tab.section === 'support').length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'subscription':
        return <SubscriptionSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
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

  const filteredTabs = TABS.filter(tab => 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTab = TABS.find(tab => tab.id === activeTab);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-header-top">
          <div className="settings-header-left">
            <button className="back-btn-modern" onClick={() => navigate('/')}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dashboard
            </button>
            <div className="settings-title-wrapper">
              <h1>Settings</h1>
              <p className="settings-subtitle">Manage your account preferences and configuration</p>
            </div>
          </div>
        </div>
        <div className="settings-summary-strip">
          <div className="settings-summary-card">
            <span className="settings-summary-value">{visibleTabs}</span>
            <span className="settings-summary-label">Sections</span>
          </div>
          <div className="settings-summary-card">
            <span className="settings-summary-value">{generalTabs}</span>
            <span className="settings-summary-label">General</span>
          </div>
          <div className="settings-summary-card">
            <span className="settings-summary-value">{supportTabs}</span>
            <span className="settings-summary-label">Support</span>
          </div>
        </div>
      </div>

      <div className="settings-container">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <div className="settings-search-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="settings-search"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <nav className="settings-nav">
            <div className="settings-nav-section">
              <span className="nav-section-title">General</span>
              {filteredTabs.filter((tab) => tab.section === 'general').map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="tab-icon-wrapper">
                    <span className="tab-icon"><SettingsIcon name={tab.icon} /></span>
                  </div>
                  <div className="tab-content">
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-description">{tab.description}</span>
                  </div>
                  {activeTab === tab.id && <div className="active-indicator"></div>}
                </button>
              ))}
            </div>

            <div className="settings-nav-section">
              <span className="nav-section-title">Support</span>
              {filteredTabs.filter((tab) => tab.section === 'support').map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="tab-icon-wrapper">
                    <span className="tab-icon"><SettingsIcon name={tab.icon} /></span>
                  </div>
                  <div className="tab-content">
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-description">{tab.description}</span>
                  </div>
                  {activeTab === tab.id && <div className="active-indicator"></div>}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <main className="settings-content">
          <div className="settings-content-header">
            <div className="content-header-icon"><SettingsIcon name={currentTab?.icon} /></div>
            <div className="content-header-text">
              <h2>{currentTab?.label}</h2>
              <p>{currentTab?.description}</p>
            </div>
          </div>
          <div className="settings-content-body">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
