import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { REQUEST_PASSWORD_RESET, RESET_PASSWORD } from '../graphql/queries';
import BrandMark from '../components/BrandMark';
import './Auth.css';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uidb64 = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const hasResetToken = Boolean(uidb64 && token);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [requestPasswordReset, { loading: requesting }] = useMutation(REQUEST_PASSWORD_RESET);
  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD);

  useEffect(() => {
    setError('');
    setInfo('');
    setNewPassword('');
    setConfirmPassword('');
  }, [uidb64, token]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter the email address for your account.');
      return;
    }

    try {
      const res = await requestPasswordReset({ variables: { email: trimmedEmail } });
      const data = res.data?.requestPasswordReset;
      if (data?.success) {
        setInfo(data.message || 'Check your inbox for the reset link.');
      } else {
        setError(data?.message || 'Unable to send reset link right now.');
      }
    } catch (err) {
      setError(err.message || 'Unable to send reset link right now.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await resetPassword({
        variables: {
          uidb64,
          token,
          newPassword,
        },
      });
      const data = res.data?.resetPassword;
      if (data?.success) {
        setInfo(data.message || 'Password updated successfully.');
        setTimeout(() => navigate('/login', { replace: true }), 1400);
      } else {
        setError(data?.message || 'This reset link is invalid or expired.');
      }
    } catch (err) {
      setError(err.message || 'This reset link is invalid or expired.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo"><BrandMark /></span>
            <h1>{hasResetToken ? 'Set New Password' : 'Reset Password'}</h1>
            <p>
              {hasResetToken
                ? 'Choose a new password for your account.'
                : 'Enter your email and we will send you a secure reset link.'}
            </p>
          </div>

          {error && <div className="auth-alert error">⚠️ {error}</div>}
          {info && <div className="auth-alert success">✓ {info}</div>}

          {!hasResetToken ? (
            <form className="auth-form" onSubmit={handleRequestReset}>
              <div className="auth-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
              <button className="auth-btn auth-btn-primary" type="submit" disabled={requesting}>
                {requesting ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  autoFocus
                  required
                />
              </div>
              <div className="auth-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <button className="auth-btn auth-btn-primary" type="submit" disabled={resetting}>
                {resetting ? 'Updating password...' : 'Update Password'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <button className="auth-link" type="button" onClick={() => navigate('/login')}>
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;