import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';

const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($oldPassword: String!, $newPassword: String!) {
    updatePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export default function AccountSettings() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState(null);

  const [updatePassword, { loading }] = useMutation(UPDATE_PASSWORD, {
    onCompleted: (data) => {
      if (data.updatePassword.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.updatePassword.message });
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' });
      return;
    }

    updatePassword({
      variables: {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      setMessage({ type: 'error', text: 'Account deletion is not yet implemented.' });
    }
  };

  return (
    <div>
      <div className="settings-section">
        <h2>Account Security</h2>
        <p className="subtitle">Manage your account security and password</p>

        {message && (
          <div className={`settings-info-card ${message.type === 'error' ? 'error' : 'success'}`} 
               style={{ 
                 borderLeft: `4px solid ${message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                 marginBottom: '24px' 
               }}>
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="settings-form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
            <span className="input-hint">Must be at least 8 characters long</span>
          </div>

          <div className="settings-form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="settings-btn-group">
            <button type="submit" className="settings-btn settings-btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Two-Factor Authentication</h2>
        <p className="subtitle">Add an extra layer of security to your account</p>
        
        <div className="settings-info-card">
          <h3>🔐 Enable 2FA</h3>
          <p>Two-factor authentication adds an additional layer of security by requiring a verification code in addition to your password.</p>
        </div>

        <div className="settings-btn-group">
          <button className="settings-btn settings-btn-secondary">
            Enable 2FA
          </button>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Danger Zone</h2>
        <p className="subtitle">Permanent actions that cannot be undone</p>
        
        <div className="settings-info-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <h3>⚠️ Delete Account</h3>
          <p>Once you delete your account, there is no going back. All your data, projects, and analyses will be permanently removed.</p>
        </div>

        <div className="settings-btn-group">
          <button className="settings-btn settings-btn-danger" onClick={handleDeleteAccount}>
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}
