import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!, $confirmation: String!) {
    deleteAccount(password: $password, confirmation: $confirmation) {
      success
      message
    }
  }
`;

const ENABLE_2FA = gql`
  mutation Enable2FA($password: String!) {
    enable2Fa(password: $password) {
      success
      message
      secret
      qrCodeUrl
    }
  }
`;

const VERIFY_2FA = gql`
  mutation Verify2FA($secret: String!, $code: String!) {
    verify2Fa(secret: $secret, code: $code) {
      success
      message
    }
  }
`;

const DISABLE_2FA = gql`
  mutation Disable2FA($password: String!) {
    disable2Fa(password: $password) {
      success
      message
    }
  }
`;

const GET_USER_INFO = gql`
  query GetUserInfo {
    userInfo {
      profile {
        twoFactorEnabled
      }
    }
  }
`;

export default function AccountSettings() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmation: ''
  });
  const [twoFactorData, setTwoFactorData] = useState({
    password: '',
    secret: '',
    code: '',
    qrCodeUrl: '',
    showSetup: false,
    showVerify: false
  });
  const [message, setMessage] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [twoFactorMessage, setTwoFactorMessage] = useState(null);

  const { data: userInfoData } = useQuery(GET_USER_INFO);
  const twoFactorEnabled = userInfoData?.userInfo?.profile?.twoFactorEnabled || false;

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: (data) => {
      if (data.changePassword.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.changePassword.message });
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [deleteAccount, { loading: deleteLoading }] = useMutation(DELETE_ACCOUNT, {
    onCompleted: (data) => {
      if (data.deleteAccount.success) {
        localStorage.removeItem('jwt_token');
        window.location.href = '/';
      } else {
        setDeleteMessage({ type: 'error', text: data.deleteAccount.message });
      }
    },
    onError: (error) => {
      setDeleteMessage({ type: 'error', text: error.message });
    }
  });

  const [enable2FA, { loading: enable2FALoading }] = useMutation(ENABLE_2FA, {
    onCompleted: (data) => {
      if (data.enable2Fa.success) {
        setTwoFactorData({
          ...twoFactorData,
          secret: data.enable2Fa.secret,
          qrCodeUrl: data.enable2Fa.qrCodeUrl,
          showSetup: false,
          showVerify: true,
          password: ''
        });
        setTwoFactorMessage({ type: 'success', text: data.enable2Fa.message });
      } else {
        setTwoFactorMessage({ type: 'error', text: data.enable2Fa.message });
      }
    },
    onError: (error) => {
      setTwoFactorMessage({ type: 'error', text: error.message });
    }
  });

  const [verify2FA, { loading: verify2FALoading }] = useMutation(VERIFY_2FA, {
    onCompleted: (data) => {
      if (data.verify2Fa.success) {
        setTwoFactorMessage({ type: 'success', text: '2FA enabled successfully!' });
        setTwoFactorData({
          password: '',
          secret: '',
          code: '',
          qrCodeUrl: '',
          showSetup: false,
          showVerify: false
        });
        window.location.reload();
      } else {
        setTwoFactorMessage({ type: 'error', text: data.verify2Fa.message });
      }
    },
    onError: (error) => {
      setTwoFactorMessage({ type: 'error', text: error.message });
    }
  });

  const [disable2FA, { loading: disable2FALoading }] = useMutation(DISABLE_2FA, {
    onCompleted: (data) => {
      if (data.disable2Fa.success) {
        setTwoFactorMessage({ type: 'success', text: '2FA disabled successfully!' });
        window.location.reload();
      } else {
        setTwoFactorMessage({ type: 'error', text: data.disable2Fa.message });
      }
    },
    onError: (error) => {
      setTwoFactorMessage({ type: 'error', text: error.message });
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

    changePassword({
      variables: {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }
    });
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    setDeleteMessage(null);

    if (deleteData.confirmation.toUpperCase() !== 'DELETE') {
      setDeleteMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    if (window.confirm('This will permanently delete your account and all data. Are you absolutely sure?')) {
      deleteAccount({
        variables: {
          password: deleteData.password,
          confirmation: deleteData.confirmation
        }
      });
    }
  };

  const handleEnable2FA = (e) => {
    e.preventDefault();
    setTwoFactorMessage(null);
    enable2FA({
      variables: { password: twoFactorData.password }
    });
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    setTwoFactorMessage(null);
    verify2FA({
      variables: {
        secret: twoFactorData.secret,
        code: twoFactorData.code
      }
    });
  };

  const handleDisable2FA = () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (password) {
      setTwoFactorMessage(null);
      disable2FA({
        variables: { password }
      });
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
        
        {twoFactorMessage && (
          <div className={`settings-info-card ${twoFactorMessage.type === 'error' ? 'error' : 'success'}`} 
               style={{ 
                 borderLeft: `4px solid ${twoFactorMessage.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                 marginBottom: '24px' 
               }}>
            <p>{twoFactorMessage.text}</p>
          </div>
        )}

        {twoFactorEnabled ? (
          <div className="settings-info-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <h3>✅ 2FA Enabled</h3>
            <p>Your account is protected with two-factor authentication.</p>
            <div className="settings-btn-group" style={{ marginTop: '16px' }}>
              <button 
                className="settings-btn settings-btn-danger" 
                onClick={handleDisable2FA}
                disabled={disable2FALoading}
              >
                {disable2FALoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="settings-info-card">
              <h3>Enable 2FA</h3>
              <p>Two-factor authentication adds an additional layer of security by requiring a verification code in addition to your password.</p>
            </div>

            {!twoFactorData.showSetup && !twoFactorData.showVerify && (
              <div className="settings-btn-group">
                <button 
                  className="settings-btn settings-btn-secondary"
                  onClick={() => setTwoFactorData({ ...twoFactorData, showSetup: true })}
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {twoFactorData.showSetup && (
              <form onSubmit={handleEnable2FA}>
                <div className="settings-form-group">
                  <label htmlFor="twoFactorPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="twoFactorPassword"
                    value={twoFactorData.password}
                    onChange={(e) => setTwoFactorData({ ...twoFactorData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="settings-btn-group">
                  <button type="submit" className="settings-btn settings-btn-primary" disabled={enable2FALoading}>
                    {enable2FALoading ? 'Generating...' : 'Generate QR Code'}
                  </button>
                  <button 
                    type="button" 
                    className="settings-btn settings-btn-secondary"
                    onClick={() => setTwoFactorData({ ...twoFactorData, showSetup: false, password: '' })}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {twoFactorData.showVerify && twoFactorData.qrCodeUrl && (
              <div>
                <div className="settings-info-card">
                  <h3>Scan QR Code</h3>
                  <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  <div className="settings-qr-wrap">
                    <img src={twoFactorData.qrCodeUrl} alt="2FA QR Code" className="settings-qr-code" />
                  </div>
                  <p className="settings-qr-secret">
                    Manual entry key: <code>{twoFactorData.secret}</code>
                  </p>
                </div>
                <form onSubmit={handleVerify2FA}>
                  <div className="settings-form-group">
                    <label htmlFor="verificationCode">Enter 6-digit code from app</label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={twoFactorData.code}
                      onChange={(e) => setTwoFactorData({ ...twoFactorData, code: e.target.value })}
                      maxLength="6"
                      placeholder="000000"
                      required
                    />
                  </div>
                  <div className="settings-btn-group">
                    <button type="submit" className="settings-btn settings-btn-primary" disabled={verify2FALoading}>
                      {verify2FALoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    <button 
                      type="button" 
                      className="settings-btn settings-btn-secondary"
                      onClick={() => setTwoFactorData({ password: '', secret: '', code: '', qrCodeUrl: '', showSetup: false, showVerify: false })}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Danger Zone</h2>
        <p className="subtitle">Permanent actions that cannot be undone</p>
        
        {deleteMessage && (
          <div className="settings-info-card settings-callout error">
            <p>{deleteMessage.text}</p>
          </div>
        )}

        <div className="settings-info-card settings-callout error">
          <h3>Delete Account</h3>
          <p>Once you delete your account, there is no going back. All your data, projects, and analyses will be permanently removed.</p>
        </div>

        <form onSubmit={handleDeleteAccount}>
          <div className="settings-form-group">
            <label htmlFor="deletePassword">Confirm Password</label>
            <input
              type="password"
              id="deletePassword"
              value={deleteData.password}
              onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="deleteConfirmation">Type DELETE to confirm</label>
            <input
              type="text"
              id="deleteConfirmation"
              value={deleteData.confirmation}
              onChange={(e) => setDeleteData({ ...deleteData, confirmation: e.target.value })}
              placeholder="DELETE"
              required
            />
          </div>

          <div className="settings-btn-group">
            <button type="submit" className="settings-btn settings-btn-danger" disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
