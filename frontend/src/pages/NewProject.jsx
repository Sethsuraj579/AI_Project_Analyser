import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_PROJECT, GET_ALL_PROJECTS } from '../graphql/queries';

function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    repoUrl: '',
    frontendUrl: '',
    backendUrl: '',
  });
  const [error, setError] = useState(null);

  const [createProject, { loading }] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_ALL_PROJECTS }],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return;
    try {
      const res = await createProject({ variables: form });
      const result = res.data?.createProject;
      if (result?.success && result?.project?.id) {
        navigate(`/project/${result.project.id}`);
      } else {
        setError(result?.message || 'Failed to create project. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h2>Create New Project</h2>
        <p>Add a project to analyse its frontend, backend, database, API, structure, integration & security.</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid var(--accent-red, #ff1744)',
            borderRadius: 'var(--radius-sm, 8px)',
            color: 'var(--accent-red, #ff1744)',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}
        <div className="form-group">
          <label>Project Name *</label>
          <input
            value={form.name}
            onChange={update('name')}
            placeholder="My Awesome Project"
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={update('description')}
            placeholder="Brief description of the project..."
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Repository URL</label>
          <input
            value={form.repoUrl}
            onChange={update('repoUrl')}
            placeholder="https://github.com/user/repo"
          />
        </div>
        <div className="form-group">
          <label>Frontend URL (for real-time probing)</label>
          <input
            value={form.frontendUrl}
            onChange={update('frontendUrl')}
            placeholder="https://myapp.com"
          />
        </div>
        <div className="form-group">
          <label>Backend / API URL (for real-time probing)</label>
          <input
            value={form.backendUrl}
            onChange={update('backendUrl')}
            placeholder="https://api.myapp.com"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : '+ Create Project'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewProject;
