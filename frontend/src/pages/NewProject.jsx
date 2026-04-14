import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_PROJECT, GET_ALL_PROJECTS } from '../graphql/queries';
import './NewProject.css';

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
    <div className="new-project-page">
      <section className="new-project-hero">
        <h2>Create New Project</h2>
        <p>Add your repository and optional live URLs to generate a complete AI project report.</p>
      </section>

      <section className="new-project-panel">
        <div className="new-project-panel-head">
          <h3>Project Setup</h3>
          <p>Fill in your project metadata. Only project name is required to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="new-project-form">
          {error && <div className="new-project-error">{error}</div>}

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

          <div className="new-project-grid">
            <div className="form-group">
              <label>Repository URL</label>
              <input
                value={form.repoUrl}
                onChange={update('repoUrl')}
                placeholder="https://github.com/user/repo"
              />
            </div>
            <div className="form-group">
              <label>Frontend URL</label>
              <input
                value={form.frontendUrl}
                onChange={update('frontendUrl')}
                placeholder="https://myapp.com"
              />
            </div>
            <div className="form-group">
              <label>Backend / API URL</label>
              <input
                value={form.backendUrl}
                onChange={update('backendUrl')}
                placeholder="https://api.myapp.com"
              />
            </div>
          </div>

          <div className="new-project-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </section>

      <section className="new-project-tips">
        <h4>Tip</h4>
        <p>
          Add both repository and live URLs for deeper insight quality, integration checks, and report completeness.
        </p>
      </section>
    </div>
  );
}

export default NewProject;
