import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_OTP, REGISTER_USER, GOOGLE_AUTH, VERIFY_GOOGLE_OTP } from '../graphql/queries';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './Auth.css';

function Register({ onLogin, onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verification, 3 = Google OTP verification
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Google OTP state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleOtp, setGoogleOtp] = useState('');
  const [googleIsNewUser, setGoogleIsNewUser] = useState(false);

  const [sendOtp, { loading: sendingOtp }] = useMutation(SEND_OTP);
  const [registerUser, { loading: registering }] = useMutation(REGISTER_USER);
  const [googleAuth, { loading: googleLoading }] = useMutation(GOOGLE_AUTH);
  const [verifyGoogleOtp, { loading: verifyingGoogleOtp }] = useMutation(VERIFY_GOOGLE_OTP);

  const trimmedUsername = form.username.trim();
  const trimmedEmail = form.email.trim().toLowerCase();
  const trimmedPassword = form.password;
  const isSendDisabled = sendingOtp || !trimmedUsername || !trimmedEmail || !trimmedPassword || !form.confirmPassword;
  const isVerifyDisabled = registering || !otpCode.trim();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await sendOtp({ variables: { email: trimmedEmail } });
      if (res.data?.sendOtp?.success) {
        setStep(2);
        setInfo(res.data.sendOtp.message);
      } else {
        setError(res.data?.sendOtp?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!otpCode.trim()) {
      setError('Please enter the OTP code.');
      return;
    }

    try {
      const res = await registerUser({
        variables: {
          username: trimmedUsername,
          email: trimmedEmail,
          password: trimmedPassword,
          otpCode: otpCode.trim(),
        },
      });
      const data = res.data?.registerUser;
      if (data?.success && data?.token) {
        localStorage.setItem('jwt_token', data.token);
        onLogin(data.token);
      } else {
        setError(data?.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setInfo('');
    if (!trimmedEmail) {
      setError('Please enter a valid email first.');
      setStep(1);
      return;
    }
    try {
      const res = await sendOtp({ variables: { email: trimmedEmail } });
      if (res.data?.sendOtp?.success) {
        setInfo(res.data.sendOtp.message);
      } else {
        setError(res.data?.sendOtp?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setInfo('');
    try {
      if (!credentialResponse?.credential) {
        setError('Google sign-up failed.');
        return;
      }
      const res = await googleAuth({
        variables: { googleToken: credentialResponse.credential },
      });
      const data = res.data?.googleAuth;
      if (data?.success) {
        // Show Google OTP verification step
        setGoogleEmail(data.email);
        setGoogleIsNewUser(data.isNewUser);
        setStep(3); // Go to Google OTP step
        setInfo(data.message || 'Verification code sent to your email. Please check your inbox.');
        setGoogleOtp('');
      } else {
        setError(data?.message || 'Google sign-up failed.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🔬</span>
            <h1>
              {step === 1 ? 'Create Account' : step === 2 ? 'Verify Email' : 'Verify Email'}
            </h1>
            <p>
              {step === 1 
                ? 'Start analyzing your projects with AI-powered insights' 
                : 'Enter the verification code sent to your email'}
            </p>
          </div>

          {error && <div className="auth-alert error">⚠️ {error}</div>}
          {info && <div className="auth-alert success">✓ {info}</div>}

          {step === 1 ? (
            <>
              <form className="auth-form" onSubmit={handleSendOTP}>
                <div className="auth-form-group">
                  <label>Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => {
                      setForm({ ...form, username: e.target.value });
                      if (error) setError('');
                    }}
                    placeholder="Choose a username"
                    name="username"
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </div>
                <div className="auth-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (error) setError('');
                    }}
                    placeholder="your@email.com"
                    name="email"
                    autoComplete="email"
                    required
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
                    placeholder="Minimum 8 characters"
                    name="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="auth-form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      if (error) setError('');
                    }}
                    placeholder="Re-enter password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <button
                  className="auth-btn auth-btn-primary"
                  type="submit"
                  disabled={isSendDisabled}
                >
                  {sendingOtp ? (
                    <>
                      <span className="auth-spinner"></span>
                      Sending code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                loading={googleLoading}
                text="Sign up with Google"
              />
            </>
          ) : step === 2 ? (
            // Email + Password OTP verification
            <>
              <button
                className="auth-back-btn"
                onClick={() => { setStep(1); setOtpCode(''); setError(''); setInfo(''); }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <p style={{ color: '#6b6b80', fontSize: '0.9rem', marginBottom: 20, textAlign: 'center' }}>
                We sent a 6-digit code to{' '}
                <span className="auth-email-highlight">{form.email}</span>
              </p>
              <form className="auth-form" onSubmit={handleVerifyAndRegister}>
                <div className="auth-form-group">
                  <label>Verification Code</label>
                  <input
                    className="auth-otp-input"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (error) setError('');
                    }}
                    placeholder="000000"
                    required
                    autoFocus
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <button
                  className="auth-btn auth-btn-primary"
                  type="submit"
                  disabled={isVerifyDisabled}
                >
                  {registering ? (
                    <>
                      <span className="auth-spinner"></span>
                      Creating account...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </form>
              <div className="auth-footer">
                Didn't receive the code?{' '}
                <button
                  className="auth-link"
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                >
                  Resend code
                </button>
              </div>
            </>
          ) : (
            // Google OTP verification
            <>
              <button
                className="auth-back-btn"
                onClick={() => { setStep(1); setGoogleOtp(''); setError(''); setInfo(''); }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <p style={{ color: '#6b6b80', fontSize: '0.9rem', marginBottom: 20, textAlign: 'center' }}>
                We sent a 6-digit code to{' '}
                <span className="auth-email-highlight">{googleEmail}</span>
              </p>
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
                    required
                    autoFocus
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <button
                  className="auth-btn auth-btn-primary"
                  type="submit"
                  disabled={verifyingGoogleOtp}
                >
                  {verifyingGoogleOtp ? (
                    <>
                      <span className="auth-spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    `Verify & ${googleIsNewUser ? 'Create Account' : 'Sign In'}`
                  )}
                </button>
              </form>
            </>
          )}

          <div className="auth-footer">
            Already have an account?{' '}
            <button className="auth-link" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
