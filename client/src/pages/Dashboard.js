import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CautionAlert from '../components/CautionAlert';
import AddTransactionModal from '../components/AddTransactionModal';
import { FiPlus, FiTrendingDown, FiDollarSign, FiAlertCircle, FiPocket } from 'react-icons/fi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const allowance = parseFloat(user?.monthly_allowance || 0);
  const needsPct = user?.needs_percentage || 60;
  const wantsPct = user?.wants_percentage || 40;
  const needsBudget = (allowance * needsPct) / 100;
  const wantsBudget = (allowance * wantsPct) / 100;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get(`/transactions/summary?month=${month}&year=${year}`),
        api.get(`/transactions?month=${month}&year=${year}`),
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      if (txRes.data.success) setRecentTx(txRes.data.data.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh user profile
  useEffect(() => {
    api.get('/user/profile').then(res => {
      if (res.data.success) updateUser(res.data.data);
    }).catch(() => { });
  }, []);

  const needsSpent = summary?.typeSummary?.find(t => t.type === 'needs')?.total || 0;
  const wantsSpent = summary?.typeSummary?.find(t => t.type === 'wants')?.total || 0;
  const totalSpent = parseFloat(needsSpent) + parseFloat(wantsSpent);
  const totalSaved = allowance - totalSpent;
  const savingsPct = allowance > 0 ? (totalSaved / allowance) * 100 : 100;

  // Days remaining in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = now.getDate();
  const daysLeft = month === now.getMonth() + 1 && year === now.getFullYear()
    ? daysInMonth - today
    : 0;

  // Caution logic
  const getCautionLevel = () => {
    if (allowance === 0) return null;
    const wantsRemaining = wantsBudget - wantsSpent;
    const wantsRemainingPct = (wantsRemaining / wantsBudget) * 100;
    if (savingsPct < 10 || totalSaved < 0) return 'danger';
    if (savingsPct < 20 || (wantsRemainingPct < 15 && daysLeft > 5)) return 'warning';
    return null;
  };

  const cautionLevel = getCautionLevel();

  const changeMonth = (dir) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  };

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div>
      {/* Setup Banner */}
      {allowance === 0 && (
        <div className="setup-banner">
          <div className="setup-banner-text">
            <h3>👋 Set up your monthly allowance</h3>
            <p>Tell us your pocket money to enable budget tracking and spending alerts.</p>
          </div>
          <button className="btn-setup" onClick={() => navigate('/settings')}>
            Configure Now →
          </button>
        </div>
      )}

      {/* Caution Alert */}
      {cautionLevel && (
        <CautionAlert
          level={cautionLevel}
          savingsPct={savingsPct}
          totalSaved={totalSaved}
          wantsBudget={wantsBudget}
          wantsSpent={wantsSpent}
          daysLeft={daysLeft}
        />
      )}

      {/* Month Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
          📅 {MONTHS[month - 1]} {year} Overview
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="month-nav-btn" onClick={() => changeMonth(-1)}>◀</button>
          <div className="month-selector">
            {MONTHS[month - 1]} {year}
          </div>
          <button className="month-nav-btn" onClick={() => changeMonth(1)}>▶</button>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem', width: 'auto', marginLeft: '8px' }}
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon green"><FiDollarSign /></div>
          <div className="stat-label">Monthly Allowance</div>
          <div className="stat-value">{fmt(allowance)}</div>
          <div className="stat-sub">{needsPct}% Needs + {wantsPct}% Wants</div>
        </div>

        <div className={`stat-card ${totalSpent > allowance ? 'red' : 'amber'}`}>
          <div className={`stat-icon ${totalSpent > allowance ? 'red' : 'amber'}`}><FiTrendingDown /></div>
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{fmt(totalSpent)}</div>
          <div className="stat-sub">{allowance > 0 ? `${Math.min(((totalSpent / allowance) * 100), 100).toFixed(1)}% of budget` : 'Set allowance first'}</div>
        </div>

        <div className={`stat-card ${savingsPct < 20 ? 'red' : 'green'}`}>
          <div className={`stat-icon ${savingsPct < 20 ? 'red' : 'green'}`}><FiPocket /></div>
          <div className="stat-label">Remaining Savings</div>
          <div className="stat-value" style={{ color: totalSaved < 0 ? 'var(--danger)' : undefined }}>{fmt(Math.max(totalSaved, 0))}</div>
          <div className="stat-sub">{savingsPct.toFixed(1)}% remaining</div>
        </div>

        <div className={`stat-card ${daysLeft <= 5 && isCurrentMonth ? 'red' : 'blue'}`}>
          <div className={`stat-icon ${daysLeft <= 5 && isCurrentMonth ? 'red' : 'blue'}`}><FiAlertCircle /></div>
          <div className="stat-label">{isCurrentMonth ? 'Days Left in Month' : 'Month'}</div>
          <div className="stat-value">{isCurrentMonth ? daysLeft : MONTHS[month - 1]}</div>
          <div className="stat-sub">{isCurrentMonth ? `${today} of ${daysInMonth} days passed` : `Year ${year}`}</div>
        </div>
      </div>

      {/* Buckets */}
      <div className="buckets-grid">
        {/* Needs Bucket */}
        <div className="bucket-card needs">
          <div className="bucket-icon">🍱</div>
          <div className="bucket-type">Needs</div>
          <div className="bucket-name">Food, Rent, Travel & Essentials</div>
          <div className="bucket-amount">{fmt(needsBudget)}</div>
          <div className="bucket-remaining">
            Spent: {fmt(needsSpent)} &nbsp;·&nbsp; Remaining: {fmt(Math.max(needsBudget - needsSpent, 0))}
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-label-row">
              <span>{needsBudget > 0 ? `${Math.min(((needsSpent / needsBudget) * 100), 100).toFixed(0)}%` : '0%'} used</span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${needsSpent > needsBudget ? 'red' : 'green'}`}
                style={{ width: `${Math.min((needsSpent / Math.max(needsBudget, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wants Bucket */}
        <div className="bucket-card wants">
          <div className="bucket-icon">🎉</div>
          <div className="bucket-type">Wants</div>
          <div className="bucket-name">Movies, Outings, Shopping</div>
          <div className="bucket-amount">{fmt(wantsBudget)}</div>
          <div className="bucket-remaining">
            Spent: {fmt(wantsSpent)} &nbsp;·&nbsp; Remaining: {fmt(Math.max(wantsBudget - wantsSpent, 0))}
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-label-row">
              <span>{wantsBudget > 0 ? `${Math.min(((wantsSpent / wantsBudget) * 100), 100).toFixed(0)}%` : '0%'} used</span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${wantsSpent > wantsBudget ? 'red' : 'amber'}`}
                style={{ width: `${Math.min((wantsSpent / Math.max(wantsBudget, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/transactions')}
          >
            View All →
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">
              <div className="spinner dark" style={{ width: 28, height: 28 }}></div>
            </div>
          ) : recentTx.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">No transactions this month</div>
              <div className="empty-state-desc">Click "Add Expense" to log your first expense.</div>
            </div>
          ) : (
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Sub-category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td>
                        <div className="tx-title">{tx.title}</div>
                        {tx.note && <div className="tx-note">{tx.note}</div>}
                      </td>
                      <td>
                        <span className={`badge badge-${tx.type}`}>
                          {tx.type === 'needs' ? '🍱 Needs' : '🎉 Wants'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tx.subcategory}</td>
                      <td className={`tx-amount ${tx.type}`}>− {fmt(tx.amount)}</td>
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
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

