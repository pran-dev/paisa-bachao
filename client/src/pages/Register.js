import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Enter a valid email.';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.message);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <div className="brand-logo">Paisa<span>Bachao</span></div>
        <div className="brand-tagline">Turn your allowance into savings 💸</div>
        <ul className="brand-features">
          {[
            { icon: '🎓', text: 'Built specifically for college students' },
            { icon: '🧮', text: '60/40 Needs-Wants automatic split' },
            { icon: '📱', text: 'Log expenses in seconds' },
            { icon: '📉', text: 'Track savings depletion over time' },
            { icon: '🆓', text: 'Completely free to use' },
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
          <h2>Create your account</h2>
          <p className="subtitle">Start your smart budgeting journey today.</p>

          {serverError && (
            <div className="alert alert-danger">
              <span>⚠️</span> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className={`form-control${errors.name ? ' is-error' : ''}`}
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={handleChange}
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className={`form-control${errors.email ? ' is-error' : ''}`}
                placeholder="rahul@college.edu"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className={`form-control${errors.password ? ' is-error' : ''}`}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                className={`form-control${errors.confirm ? ' is-error' : ''}`}
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
              />
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"></span> Creating account...</> : '→ Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>Sign in →</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            By registering, you agree to use PaisaBachao responsibly 🙏
          </p>
        </div>
      </div>
    </div>
  );
}

