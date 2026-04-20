import React, { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import BrandMark from './components/BrandMark';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages for code-splitting
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const NewProject = lazy(() => import('./pages/NewProject'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Settings = lazy(() => import('./pages/Settings'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div className="spinner" style={{
          width: 40, height: 40, border: '4px solid #e0e0e0',
          borderTop: '4px solid #4f46e5', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
        }} />
        <p>Loading...</p>
      </div>
    </div>
  );
}

function SettingsGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8.56 2.2a1 1 0 0 1 1.88 0l.2.62a1 1 0 0 0 1.17.66l.63-.15a1 1 0 0 1 1.34 1.33l-.16.63a1 1 0 0 0 .67 1.17l.61.2a1 1 0 0 1 0 1.88l-.61.2a1 1 0 0 0-.67 1.17l.16.63a1 1 0 0 1-1.34 1.33l-.63-.16a1 1 0 0 0-1.17.67l-.2.61a1 1 0 0 1-1.88 0l-.2-.61a1 1 0 0 0-1.17-.67l-.63.16a1 1 0 0 1-1.34-1.33l.16-.63a1 1 0 0 0-.67-1.17l-.61-.2a1 1 0 0 1 0-1.88l.61-.2a1 1 0 0 0 .67-1.17l-.16-.63a1 1 0 0 1 1.34-1.33l.63.15a1 1 0 0 0 1.17-.66l.2-.62z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9.5" cy="9.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (newToken) => {
    setToken(newToken);
    navigate('/');
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    navigate('/');
  }, [navigate]);

  // Listen for forced logout from Apollo error link (expired token)
  useEffect(() => {
    const onForceLogout = () => handleLogout();
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, [handleLogout]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!token) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <Login
                onLogin={handleLogin}
                onSwitchToRegister={() => navigate('/register')}
              />
            }
          />
          <Route
            path="/register"
            element={
              <Register
                onLogin={handleLogin}
                onSwitchToLogin={() => navigate('/login')}
              />
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-logo">
            <BrandMark />
          </span>
          <div className="app-brand-copy">
            <h1>AIProject Analyzer</h1>
            <p>Smart code quality insights powered by AI</p>
          </div>
        </div>
        <button
          className={`burger-btn ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`header-actions ${isMenuOpen ? 'open' : ''}`}>
          <nav>
            <NavLink end to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/new" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
              Projects
            </NavLink>
            <NavLink to="/pricing" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
              Pricing
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
              <span className="nav-icon"><SettingsGlyph /></span>
              Settings
            </NavLink>
          </nav>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<ProjectList />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/new" element={<NewProject />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
