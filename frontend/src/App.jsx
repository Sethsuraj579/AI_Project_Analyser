import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'register'

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setAuthPage('login');
  };

  if (!token) {
    if (authPage === 'register') {
      return (
        <Register
          onLogin={handleLogin}
          onSwitchToLogin={() => setAuthPage('login')}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthPage('register')}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🔬 AI Project Analyser</h1>
        <nav>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/new" className={({ isActive }) => isActive ? 'active' : ''}>
            + New Project
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => isActive ? 'active' : ''}>
            💳 Pricing
          </NavLink>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/new" element={<NewProject />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
