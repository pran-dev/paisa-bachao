
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(form.email, form.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-wrapper">

      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <div className="brand-logo">
          Paisa<span>Bachao</span>
        </div>

        <div className="brand-tagline">
          Smart money habits start here 🚀
        </div>

        <ul className="brand-features">
          {[
            { icon: '💰', text: 'Split allowance into Needs & Wants automatically' },
            { icon: '📊', text: 'Visual analytics with Chart.js dashboards' },
            { icon: '⚠️', text: 'Smart spending alerts before you overspend' },
            { icon: '🔍', text: 'Real-time transaction search & filtering' },
            { icon: '🔐', text: 'Secure JWT authentication' },
          ].map((f, i) => (
            <li key={i}>
              <div className="brand-feature-icon">{f.icon}</div>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">

          <h2>Welcome back!</h2>
          <p className="subtitle">
            Sign in to continue managing your budget.
          </p>

          {error && (
            <div className="alert alert-danger">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className={`form-control${error ? ' is-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className={`form-control${error ? ' is-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                '→ Sign In'
              )}
            </button>

          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Create one free →
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
