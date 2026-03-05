import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      username
      email
      firstName
      lastName
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($firstName: String, $lastName: String, $email: String) {
    updateProfile(firstName: $firstName, lastName: $lastName, email: $email) {
      success
      message
      user {
        id
        username
        email
        firstName
        lastName
      }
    }
  }
`;

export default function ProfileSettings() {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });
  const [message, setMessage] = useState(null);

  const { data, loading: queryLoading } = useQuery(GET_USER_PROFILE, {
    onCompleted: (data) => {
      if (data.me) {
        setProfileData({
          firstName: data.me.firstName || '',
          lastName: data.me.lastName || '',
          email: data.me.email || '',
          username: data.me.username || ''
        });
      }
    },
    onError: () => {
      // User data might not be available, use stored email
      const storedEmail = localStorage.getItem('user_email');
      if (storedEmail) {
        setProfileData(prev => ({ ...prev, email: storedEmail }));
      }
    }
  });

  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      if (data.updateProfile.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.updateProfile.message });
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const handleInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);

    updateProfile({
      variables: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email
      }
    });
  };

  return (
    <div>
      <div className="settings-section">
        <h2>Profile Information</h2>
        <p className="subtitle">Update your personal information and email address</p>

        {message && (
          <div className={`settings-info-card ${message.type === 'error' ? 'error' : 'success'}`} 
               style={{ 
                 borderLeft: `4px solid ${message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                 marginBottom: '24px' 
               }}>
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="settings-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={profileData.username}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span className="input-hint">Username cannot be changed</span>
          </div>

          <div className="settings-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profileData.firstName}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profileData.lastName}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-btn-group">
            <button 
              type="submit" 
              className="settings-btn settings-btn-primary"
              disabled={updateLoading || queryLoading}
            >
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              className="settings-btn settings-btn-secondary"
              onClick={() => window.location.reload()}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Preferences</h2>
        <p className="subtitle">Customize your experience</p>

        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <h4>Email Notifications</h4>
            <p>Receive email updates about your projects and analyses</p>
          </div>
          <div className="toggle-switch active"></div>
        </div>

        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <h4>Project Updates</h4>
            <p>Get notified when your project analysis is complete</p>
          </div>
          <div className="toggle-switch active"></div>
        </div>

        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <h4>Marketing Emails</h4>
            <p>Receive updates about new features and promotions</p>
          </div>
          <div className="toggle-switch"></div>
        </div>
      </div>
    </div>
  );
}
