import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';

function App() {
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
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/new" element={<NewProject />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
