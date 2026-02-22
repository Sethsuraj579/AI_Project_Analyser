import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_OTP, REGISTER_USER, GOOGLE_AUTH } from '../graphql/queries';
import GoogleSignInButton from '../components/GoogleSignInButton';

function Register({ onLogin, onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verification
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [sendOtp, { loading: sendingOtp }] = useMutation(SEND_OTP);
  const [registerUser, { loading: registering }] = useMutation(REGISTER_USER);
  const [googleAuth, { loading: googleLoading }] = useMutation(GOOGLE_AUTH);

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      if (!credentialResponse?.credential) {
        setError('Google sign-up failed.');
        return;
      }
      const res = await googleAuth({
        variables: { googleToken: credentialResponse.credential },
      });
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
      const data = res.data?.googleAuth;
      if (data?.success && data?.token) {
        localStorage.setItem('jwt_token', data.token);
        onLogin(data.token);
      } else {
        setError(data?.message || 'Google sign-up failed.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <h2>🔬 AI Project Analyser</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </p>

        {error && <div className="login-error">{error}</div>}
        {info && <div className="login-info">{info}</div>}

        {step === 1 ? (
          <>
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
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
                className="btn btn-primary"
                type="submit"
                disabled={isSendDisabled}
                style={{ width: '100%', marginTop: 8 }}
              >
                {sendingOtp ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              loading={googleLoading}
              text="Sign up with Google"
            />
          </>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16, textAlign: 'left' }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--accent)' }}>{form.email}</strong>
            </p>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
                placeholder="Enter 6-digit code"
                required
                autoFocus
                maxLength={6}
                inputMode="numeric"
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.5em' }}
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isVerifyDisabled}
              style={{ width: '100%', marginTop: 8 }}
            >
              {registering ? 'Creating Account...' : 'Verify & Create Account'}
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={handleResendOtp}
              style={{ marginTop: 12 }}
              disabled={sendingOtp}
            >
              Resend verification code
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => { setStep(1); setOtpCode(''); setError(''); setInfo(''); }}
              style={{ marginTop: 12 }}
            >
              ← Back to registration
            </button>
          </form>
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 20 }}>
          Already have an account?{' '}
          <button className="btn-link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
