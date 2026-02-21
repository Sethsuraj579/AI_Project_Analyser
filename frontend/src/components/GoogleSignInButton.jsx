import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleSignInButton({ onSuccess, loading, text = 'Sign in with Google' }) {
  const buttonRef = useRef(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [noClientId, setNoClientId] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setNoClientId(true);
      return;
    }

    // Load Google Identity Services script
    if (document.getElementById('google-gsi-script')) {
      if (window.google?.accounts?.id) {
        setSdkLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setSdkLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkLoaded || !window.google?.accounts?.id || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onSuccess,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: buttonRef.current.offsetWidth,
      text: text === 'Sign up with Google' ? 'signup_with' : 'signin_with',
      shape: 'rectangular',
    });
  }, [sdkLoaded, onSuccess, text]);

  if (noClientId) {
    return (
      <div className="google-btn-placeholder">
        <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Google Sign-In (configure VITE_GOOGLE_CLIENT_ID)
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div ref={buttonRef} style={{ width: '100%' }} />
      {loading && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Authenticating with Google...
        </p>
      )}
    </div>
  );
}

export default GoogleSignInButton;
