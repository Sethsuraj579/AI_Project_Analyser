import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER, GOOGLE_AUTH, VERIFY_GOOGLE_OTP } from '../graphql/queries';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './Auth.css';

function Login({ onLogin, onSwitchToRegister }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  
  // Google OTP verification state
  const [googleOtpStep, setGoogleOtpStep] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleOtp, setGoogleOtp] = useState('');

  const [tokenAuth, { loading }] = useMutation(LOGIN_USER, {
    onCompleted(data) {
      const result = data?.loginUser;
      if (result?.success && result?.token) {
        localStorage.setItem('jwt_token', result.token);
        onLogin(result.token);
      } else {
        setError(result?.message || 'Login failed');
      }
    },
    onError(err) {
      setError(err.message || 'Invalid credentials');
    },
  });

  const [googleAuth, { loading: googleLoading }] = useMutation(GOOGLE_AUTH);
  const [verifyGoogleOtp, { loading: verifyingOtp }] = useMutation(VERIFY_GOOGLE_OTP);

  const trimmedUsername = form.username.trim();
  const trimmedPassword = form.password;
  const isSubmitDisabled = !trimmedUsername || !trimmedPassword || loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!trimmedUsername || !trimmedPassword) {
      setError('Please enter your username and password.');
      return;
    }
    tokenAuth({ variables: { username: trimmedUsername, password: trimmedPassword } });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setInfo('');
    try {
      const res = await googleAuth({
        variables: { googleToken: credentialResponse.credential },
      });
      const data = res.data?.googleAuth;
      if (data?.success) {
        // Now show OTP verification step
        setGoogleEmail(data.email);
        setGoogleOtpStep(true);
        setInfo(data.message || 'Verification code sent to your email. Please check your inbox.');
        setGoogleOtp('');
      } else {
        setError(data?.message || 'Google sign-in failed.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  const handleVerifyGoogleOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!googleOtp.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    try {
      const res = await verifyGoogleOtp({
        variables: { email: googleEmail, otpCode: googleOtp.trim() },
      });
      const data = res.data?.verifyGoogleOtp;
      if (data?.success && data?.token) {
        localStorage.setItem('jwt_token', data.token);
        onLogin(data.token);
      } else {
        setError(data?.message || 'Verification failed.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed.');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setInfo('');
    try {
      const res = await googleAuth({
        variables: { googleToken: 'resend' }, // This won't work - need to resend from backend
      });
      // Actually, we should use SendOTP mutation instead
      setInfo('Resend functionality coming soon. Try again with Google.');
    } catch (err) {
      setError('Failed to resend code.');
    }
  };

  if (googleOtpStep) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-logo">✉️</span>
              <h1>Verify Your Email</h1>
              <p>
                A verification code has been sent to{' '}
                <span className="auth-email-highlight">{googleEmail}</span>
              </p>
            </div>

            {error && <div className="auth-alert error">⚠️ {error}</div>}
            {info && <div className="auth-alert success">✓ {info}</div>}

            <form className="auth-form" onSubmit={handleVerifyGoogleOtp}>
              <div className="auth-form-group">
                <label>Verification Code</label>
                <input
                  className="auth-otp-input"
                  value={googleOtp}
                  onChange={(e) => {
                    setGoogleOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (error) setError('');
                  }}
                  placeholder="000000"
                  maxLength="6"
                  inputMode="numeric"
                  autoFocus
                />
              </div>
              <button 
                className="auth-btn auth-btn-primary" 
                type="submit" 
                disabled={verifyingOtp || !googleOtp.trim()}
              >
                {verifyingOtp ? (
                  <>
                    <span className="auth-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              Didn't receive the code?{' '}
              <button 
                className="auth-link" 
                onClick={() => setGoogleOtpStep(false)}
              >
                Try another method
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🔬</span>
            <h1>Welcome Back</h1>
            <p>Sign in to access your AI Project Analyser dashboard</p>
          </div>

          {error && <div className="auth-alert error">⚠️ {error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Username</label>
              <input
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  if (error) setError('');
                }}
                placeholder="Enter your username"
                name="username"
                autoComplete="username"
                required
                autoFocus
              />
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (error) setError('');
                }}
                placeholder="Enter your password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button 
              className="auth-btn auth-btn-primary" 
              type="submit" 
              disabled={isSubmitDisabled}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            loading={googleLoading}
            text="Sign in with Google"
          />

          <div className="auth-footer">
            Don't have an account?{' '}
            <button className="auth-link" onClick={onSwitchToRegister}>
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
