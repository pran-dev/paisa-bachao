import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import AddTransactionModal from '../components/AddTransactionModal';
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const SUBCATEGORIES = {
  needs: ['Food', 'PG/Rent', 'Stationery', 'Travel/Commute', 'Electricity', 'Medical', 'Groceries', 'Laundry', 'Internet', 'Other-Needs'],
  wants: ['Outings', 'Movies', 'Shopping', 'Fast Food', 'Subscriptions', 'Gaming', 'Gifts', 'Personal Care', 'Other-Wants'],
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subcatFilter, setSubcatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/transactions?month=${month}&year=${year}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (dateFrom && dateTo) url += `&startDate=${dateFrom}&endDate=${dateTo}`;

      const { data } = await api.get(url);
      if (data.success) setTransactions(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, typeFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(fetchTransactions, 300);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTx = subcatFilter
    ? transactions.filter(t => t.subcategory === subcatFilter)
    : transactions;

  const totalNeeds = filteredTx.filter(t => t.type === 'needs').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalWants = filteredTx.filter(t => t.type === 'wants').reduce((s, t) => s + parseFloat(t.amount), 0);

  const changeMonth = (dir) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📋 Transaction History</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="month-nav-btn" onClick={() => changeMonth(-1)}>◀</button>
          <div className="month-selector">{MONTHS[month - 1]} {year}</div>
          <button className="month-nav-btn" onClick={() => changeMonth(1)}>▶</button>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem', width: 'auto' }}
            onClick={() => { setEditTx(null); setShowAddModal(true); }}
          >
            <FiPlus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ padding: '8px 16px', background: 'var(--primary-light)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
          🍱 Needs: {fmt(totalNeeds)}
        </div>
        <div style={{ padding: '8px 16px', background: 'var(--secondary-light)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
          🎉 Wants: {fmt(totalWants)}
        </div>
        <div style={{ padding: '8px 16px', background: 'var(--border-light)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-medium)' }}>
          💰 Total: {fmt(totalNeeds + totalWants)}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body" style={{ padding: '14px 16px' }}>
          <div className="filters-row">
            {/* Search */}
            <div className="search-input-wrap">
              <FiSearch className="search-icon" size={16} />
              <input
                className="form-control"
                placeholder="Search title, category, note..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="filter-select"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setSubcatFilter(''); }}
            >
              <option value="">All Types</option>
              <option value="needs">🍱 Needs</option>
              <option value="wants">🎉 Wants</option>
            </select>

            {/* Sub-category Filter */}
            <select
              className="filter-select"
              value={subcatFilter}
              onChange={e => setSubcatFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {(typeFilter === 'needs'
                ? SUBCATEGORIES.needs
                : typeFilter === 'wants'
                  ? SUBCATEGORIES.wants
                  : [...SUBCATEGORIES.needs, ...SUBCATEGORIES.wants]
              ).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Date Range */}
            <input
              type="date"
              className="filter-select"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              placeholder="From"
              title="From date"
            />
            <input
              type="date"
              className="filter-select"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              placeholder="To"
              title="To date"
            />

            {(search || typeFilter || subcatFilter || dateFrom || dateTo) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setTypeFilter(''); setSubcatFilter(''); setDateFrom(''); setDateTo(''); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">
              <div className="spinner dark" style={{ width: 28, height: 28 }}></div>
              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading transactions...</div>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No transactions found</div>
              <div className="empty-state-desc">Try adjusting your filters or add your first expense.</div>
            </div>
          ) : (
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Sub-category</th>
                    <th>Note</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td><div className="tx-title">{tx.title}</div></td>
                      <td>
                        <span className={`badge badge-${tx.type}`}>
                          {tx.type === 'needs' ? '🍱 Needs' : '🎉 Wants'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tx.subcategory}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '160px' }}>
                        {tx.note || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`tx-amount ${tx.type}`}>− {fmt(tx.amount)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => { setEditTx(tx); setShowAddModal(true); }}
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete"
                            style={{ color: deletingId === tx.id ? 'var(--danger)' : undefined }}
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddTransactionModal
          editData={editTx}
          onClose={() => { setShowAddModal(false); setEditTx(null); }}
          onSuccess={() => { setShowAddModal(false); setEditTx(null); fetchTransactions(); }}
        />
      )}
    </div>
  );
}

