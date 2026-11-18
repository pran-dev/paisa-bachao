import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiX } from 'react-icons/fi';

const SUBCATEGORIES = {
  needs: ['Food', 'PG', 'Stationery', 'Travel', 'Electricity', 'Medical', 'Groceries', 'Laundry', 'Internet', 'Other-Needs'],
  wants: ['Outings', 'Movies', 'Shopping', 'Fast Food', 'Subscriptions', 'Gaming', 'Gifts', 'Personal Care', 'Other-Wants'],
};

const today = () => new Date().toISOString().split('T')[0];

export default function AddTransactionModal({ onClose, onSuccess, editData }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    title: editData?.title || '',
    amount: editData?.amount || '',
    type: editData?.type || 'needs',
    subcategory: editData?.subcategory || SUBCATEGORIES.needs[0],
    date: editData?.date ? editData.date.split('T')[0] : today(),
    note: editData?.note || '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  // Update subcategory when type changes
  useEffect(() => {
    if (!editData) {
      setForm(prev => ({ ...prev, subcategory: SUBCATEGORIES[form.type][0] }));
    }
  }, [form.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount.';
    if (!form.date) errs.date = 'Date is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (isEdit) {
        await api.put(`/transactions/${editData.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Transaction' : '➕ Add New Expense'}</h3>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {serverError && (
              <div className="alert alert-danger">⚠️ {serverError}</div>
            )}

            {/* Type Toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Category Type</label>
              <div className="type-toggle">
                <div
                  className={`type-option needs ${form.type === 'needs' ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, type: 'needs', subcategory: SUBCATEGORIES.needs[0] }))}
                >
                  <div className="type-option-emoji">🍱</div>
                  <div className="type-option-label" style={{ color: form.type === 'needs' ? 'var(--primary)' : 'var(--text-muted)' }}>Needs</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Essential expenses</div>
                </div>
                <div
                  className={`type-option wants ${form.type === 'wants' ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, type: 'wants', subcategory: SUBCATEGORIES.wants[0] }))}
                >
                  <div className="type-option-emoji">🎉</div>
                  <div className="type-option-label" style={{ color: form.type === 'wants' ? '#d97706' : 'var(--text-muted)' }}>Wants</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Fun & lifestyle</div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title / Description</label>
              <input
                type="text"
                name="title"
                className={`form-control${errors.title ? ' is-error' : ''}`}
                placeholder={form.type === 'needs' ? 'e.g. Lunch at canteen' : 'e.g. Movie with friends'}
                value={form.title}
                onChange={handleChange}
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Amount + Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  className={`form-control${errors.amount ? ' is-error' : ''}`}
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                />
                {errors.amount && <span className="form-error">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  className={`form-control${errors.date ? ' is-error' : ''}`}
                  value={form.date}
                  onChange={handleChange}
                  max={today()}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>
            </div>

            {/* Sub-category */}
            <div className="form-group">
              <label className="form-label">Sub-category</label>
              <select
                name="subcategory"
                className="form-control"
                value={form.subcategory}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                {SUBCATEGORIES[form.type].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label">Note <span style={{ color: 'var(--text-light)' }}>(optional)</span></label>
              <input
                type="text"
                name="note"
                className="form-control"
                placeholder="Any additional detail..."
                value={form.note}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '11px 28px' }} disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : (isEdit ? '✅ Update' : '➕ Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

