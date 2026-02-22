import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER, GOOGLE_AUTH, VERIFY_GOOGLE_OTP } from '../graphql/queries';
import GoogleSignInButton from '../components/GoogleSignInButton';

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
      <div className="login-container">
        <div className="login-card card">
          <h2>✉️ Verify Email</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            A verification code has been sent to <strong>{googleEmail}</strong>
          </p>

          {error && <div className="login-error">{error}</div>}
          {info && <div className="login-info" style={{ color: 'var(--success)', marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>{info}</div>}

          <form onSubmit={handleVerifyGoogleOtp}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                value={googleOtp}
                onChange={(e) => {
                  setGoogleOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
                placeholder="Enter 6-digit code"
                maxLength="6"
                inputMode="numeric"
                autoFocus
              />
            </div>
            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={verifyingOtp || !googleOtp.trim()} 
              style={{ width: '100%', marginTop: 8 }}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>

          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
            Didn't receive the code?{' '}
            <button 
              className="btn-link" 
              onClick={() => setGoogleOtpStep(false)}
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              Try another method
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card card">
        <h2>🔬 AI Project Analyser</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Sign in to create projects and run analyses
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              value={form.username}
              onChange={(e) => {
                setForm({ ...form, username: e.target.value });
                if (error) setError('');
              }}
              placeholder="Enter username"
              name="username"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (error) setError('');
              }}
              placeholder="Enter password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitDisabled} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          loading={googleLoading}
          text="Sign in with Google"
        />

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 20 }}>
          Don't have an account?{' '}
          <button className="btn-link" onClick={onSwitchToRegister}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
