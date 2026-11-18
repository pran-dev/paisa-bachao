import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FiSave, FiUser, FiSliders } from 'react-icons/fi';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    monthly_allowance: user?.monthly_allowance || '',
    needs_percentage: user?.needs_percentage || 60,
    wants_percentage: user?.wants_percentage || 40,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      name: user?.name || '',
      monthly_allowance: user?.monthly_allowance || '',
      needs_percentage: user?.needs_percentage || 60,
      wants_percentage: user?.wants_percentage || 40,
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-adjust wants when needs changes
      if (name === 'needs_percentage') {
        const n = Math.min(Math.max(parseInt(value) || 0, 0), 100);
        updated.needs_percentage = n;
        updated.wants_percentage = 100 - n;
      }
      if (name === 'wants_percentage') {
        const w = Math.min(Math.max(parseInt(value) || 0, 0), 100);
        updated.wants_percentage = w;
        updated.needs_percentage = 100 - w;
      }
      return updated;
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(form.needs_percentage) + parseInt(form.wants_percentage) !== 100) {
      setError('Needs + Wants must equal 100%.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/user/profile', {
        name: form.name,
        monthly_allowance: parseFloat(form.monthly_allowance) || 0,
        needs_percentage: parseInt(form.needs_percentage),
        wants_percentage: parseInt(form.wants_percentage),
      });
      if (data.success) {
        updateUser(data.data);
        setSuccess('Profile saved successfully! ✅');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allowance = parseFloat(form.monthly_allowance) || 0;
  const needsAmt = (allowance * parseInt(form.needs_percentage || 0)) / 100;
  const wantsAmt = (allowance * parseInt(form.wants_percentage || 0)) / 100;
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>⚙️ Settings</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Configure your budget preferences and profile.
        </p>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}
      {error && <div className="alert alert-danger">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Profile Section */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <span className="card-title"><FiUser size={16} style={{ marginRight: 8 }} />Profile</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}
              />
              <span className="form-hint">Email cannot be changed.</span>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <span className="card-title"><FiSliders size={16} style={{ marginRight: 8 }} />Budget Configuration</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Monthly Allowance (₹)</label>
              <input
                type="number"
                name="monthly_allowance"
                className="form-control"
                value={form.monthly_allowance}
                onChange={handleChange}
                placeholder="e.g. 5000"
                min="0"
                step="100"
              />
              <span className="form-hint">Your total pocket money for the month.</span>
            </div>

            {/* Split Sliders */}
            <div style={{ marginTop: '20px' }}>
              <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                Needs vs Wants Split
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Needs */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>🍱 Needs</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{form.needs_percentage}%</span>
                  </div>
                  <input
                    type="range"
                    name="needs_percentage"
                    min="10"
                    max="90"
                    value={form.needs_percentage}
                    onChange={handleChange}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Budget: {fmt(needsAmt)}
                  </div>
                </div>

                {/* Wants */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary-dark)' }}>🎉 Wants</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{form.wants_percentage}%</span>
                  </div>
                  <input
                    type="range"
                    name="wants_percentage"
                    min="10"
                    max="90"
                    value={form.wants_percentage}
                    onChange={handleChange}
                    style={{ width: '100%', accentColor: 'var(--secondary)' }}
                  />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Budget: {fmt(wantsAmt)}
                  </div>
                </div>
              </div>

              {/* Visual preview */}
              {allowance > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ height: '12px', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${form.needs_percentage}%`, background: 'var(--primary)', transition: 'width 0.3s' }} />
                    <div style={{ width: `${form.wants_percentage}%`, background: 'var(--secondary)', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Needs: {fmt(needsAmt)}</span>
                    <span>Wants: {fmt(wantsAmt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '11px 32px' }} disabled={saving}>
          {saving ? <><span className="spinner"></span> Saving...</> : <><FiSave size={16} /> Save Changes</>}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="card" style={{ marginTop: '32px', borderColor: '#fca5a5' }}>
        <div className="card-header" style={{ background: '#fff5f5' }}>
          <span className="card-title" style={{ color: 'var(--danger)' }}>⚠️ Account Actions</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Logging out will remove your session from this device.
          </p>
          <button className="btn btn-danger btn-sm" onClick={logout} style={{ width: 'auto' }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

