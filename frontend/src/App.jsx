import React, { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';

// Lazy-loaded pages for code-splitting
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const NewProject = lazy(() => import('./pages/NewProject'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
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

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'register'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPricingRoute = window.location.pathname === '/pricing';

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setAuthPage('login');
  }, []);

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

  if (!token && !isPricingRoute) {
    if (authPage === 'register') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Register
            onLogin={handleLogin}
            onSwitchToLogin={() => setAuthPage('login')}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthPage('register')}
        />
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🔬 AI Project Analyser</h1>
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
        <nav className={isMenuOpen ? 'open' : ''}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/new" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
            + New Project
          </NavLink>
          <NavLink to="/comparison" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
            📊 Comparison
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
            💳 Pricing
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>
            ⚙️ Settings
          </NavLink>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>
      <main className="main-content">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/new" element={<NewProject />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
