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

const TABS = [
  { 
    id: 'account', 
    label: 'Account', 
    icon: '👤',
    description: 'Security & authentication'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: '📝',
    description: 'Personal information'
  },
  { 
    id: 'subscription', 
    label: 'Subscription', 
    icon: '💳',
    description: 'Plans & billing'
  },
  { 
    id: 'integrations',
    label: 'Integrations',
    icon: '🔗',
    description: 'Webhooks & external tools',
    section: 'general',
  },
  {
    id: 'about', 
    label: 'About', 
    icon: 'ℹ️',
    description: 'App information',
    section: 'support',
  },
  { 
    id: 'contact', 
    label: 'Contact', 
    icon: '📧',
    description: 'Get in touch',
    section: 'support',
  },
  { 
    id: 'terms', 
    label: 'Terms & Conditions', 
    icon: '📜',
    description: 'Legal terms',
    section: 'support',
  },
  { 
    id: 'privacy', 
    label: 'Privacy Policy', 
    icon: '🔒',
    description: 'Data & privacy',
    section: 'support',
  },
  { 
    id: 'help', 
    label: 'Help', 
    icon: '❓',
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
                    <span className="tab-icon">{tab.icon}</span>
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
                    <span className="tab-icon">{tab.icon}</span>
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
            <div className="content-header-icon">{currentTab?.icon}</div>
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
