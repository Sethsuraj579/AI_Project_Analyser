import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TOKEN_AUTH, GOOGLE_AUTH } from '../graphql/queries';
import GoogleSignInButton from '../components/GoogleSignInButton';

function Login({ onLogin, onSwitchToRegister }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const [tokenAuth, { loading }] = useMutation(TOKEN_AUTH, {
    onCompleted(data) {
      const token = data?.tokenAuth?.token;
      if (token) {
        localStorage.setItem('jwt_token', token);
        onLogin(token);
      }
    },
    onError(err) {
      setError(err.message || 'Invalid credentials');
    },
  });

  const [googleAuth, { loading: googleLoading }] = useMutation(GOOGLE_AUTH);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    tokenAuth({ variables: form });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const res = await googleAuth({
        variables: { googleToken: credentialResponse.credential },
      });
      const data = res.data?.googleAuth;
      if (data?.success && data?.token) {
        localStorage.setItem('jwt_token', data.token);
        onLogin(data.token);
      } else {
        setError(data?.message || 'Google sign-in failed.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

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
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
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
