import React, { useState } from 'react';
import './Tabs.css';

const Tabs = ({ tabs = [], defaultActiveTab = 0, onChange = null }) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index, tabs[index].id);
    }
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  const activeTabData = tabs[activeTab];

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <button
            key={tab.id || index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabChange(index)}
            type="button"
            aria-selected={activeTab === index}
            role="tab"
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {activeTabData && (
        <div className="tabs-content">
          {typeof activeTabData.content === 'function'
            ? activeTabData.content()
            : activeTabData.content}
        </div>
      )}
    </div>
  );
};

export default Tabs;
