import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login, updateUser, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

  // Google OAuth using access_token popup flow
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        // Fetch user info from Google
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // Send to our backend
        const { data } = await api.post('/auth/google-access', {
          access_token: tokenResponse.access_token,
          userInfo,
        });

        if (data.success) {
          localStorage.setItem('pb_token', data.token);
          localStorage.setItem('pb_user', JSON.stringify(data.user));
          updateUser(data.user);
          navigate('/dashboard');
        } else {
          setError(data.message || 'Google sign-in failed.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
      setGoogleLoading(false);
    },
  });

  return (
    <div className="auth-wrapper">
      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <div className="brand-logo">Paisa<span>Bachao</span></div>
        <div className="brand-tagline">Smart money habits start here 🚀</div>
        <ul className="brand-features">
          {[
            { icon: '💰', text: 'Split allowance into Needs & Wants automatically' },
            { icon: '📊', text: 'Visual analytics with Chart.js dashboards' },
            { icon: '⚠️', text: 'Smart spending alerts before you overspend' },
            { icon: '🔍', text: 'Real-time transaction search & filtering' },
            { icon: '🔐', text: 'Secure JWT auth + Google Sign-In' },
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
          <p className="subtitle">Sign in to continue managing your budget.</p>

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

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"></span> Signing in...</> : '→ Sign In'}
            </button>
          </form>

          <div className="divider-or">or</div>

          <button
            type="button"
            className="btn btn-google"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading || loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>Create one free →</Link>
          </p>

          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Demo:</strong> demo@paisabachao.app / demo1234
          </div>
        </div>
      </div>
    </div>
  );
}
