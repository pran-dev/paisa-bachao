import { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const NEEDS_COLORS = ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0','#dcfce7','#a7f3d0','#6ee7b7','#34d399','#10b981'];
const WANTS_COLORS = ['#f59e0b','#fbbf24','#fcd34d','#fde68a','#fef3c7','#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5'];

export default function Analytics() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const allowance = parseFloat(user?.monthly_allowance || 0);
  const needsPct = user?.needs_percentage || 60;
  const wantsPct = user?.wants_percentage || 40;
  const needsBudget = (allowance * needsPct) / 100;
  const wantsBudget = (allowance * wantsPct) / 100;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/transactions/summary?month=${month}&year=${year}`);
      if (data.success) setSummary(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const changeMonth = (dir) => {
    let m = month + dir; let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  };

  const needsSpent = summary?.typeSummary?.find(t => t.type === 'needs')?.total || 0;
  const wantsSpent = summary?.typeSummary?.find(t => t.type === 'wants')?.total || 0;
  const totalSpent = parseFloat(needsSpent) + parseFloat(wantsSpent);
  const totalSaved = Math.max(allowance - totalSpent, 0);

  // Doughnut chart data
  const doughnutData = {
    labels: ['🍱 Needs', '🎉 Wants', '💰 Saved'],
    datasets: [{
      data: [
        parseFloat(needsSpent) || 0,
        parseFloat(wantsSpent) || 0,
        totalSaved,
      ],
      backgroundColor: ['#16a34a', '#f59e0b', '#3b82f6'],
      borderColor: ['#fff', '#fff', '#fff'],
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, font: { size: 13 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${fmt(ctx.raw)} (${allowance > 0 ? ((ctx.raw / allowance) * 100).toFixed(1) : 0}%)`,
        },
      },
    },
    cutout: '65%',
  };

  // Line chart: savings trend
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyTrend = summary?.dailyTrend || [];

  // Build cumulative spending array
  const dailyMap = {};
  dailyTrend.forEach(d => { dailyMap[d.day] = parseFloat(d.total); });

  const labels = [];
  const cumulativeSpent = [];
  const savingsLine = [];
  let runningTotal = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    labels.push(d);
    runningTotal += (dailyMap[dateStr] || 0);
    cumulativeSpent.push(parseFloat(runningTotal.toFixed(2)));
    savingsLine.push(parseFloat(Math.max(allowance - runningTotal, 0).toFixed(2)));
  }

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Cumulative Spent',
        data: cumulativeSpent,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Remaining Savings',
        data: savingsLine,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, font: { size: 13 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`,
          title: (items) => `Day ${items[0].label}`,
        },
      },
    },
    scales: {
      x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 11 },
          callback: (v) => `₹${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`,
        },
      },
    },
  };

  // By subcategory
  const needsCategories = (summary?.subcategorySummary || []).filter(s => s.type === 'needs');
  const wantsCategories = (summary?.subcategorySummary || []).filter(s => s.type === 'wants');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📊 Spending Analytics</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Visual breakdown of your budget for {MONTHS[month - 1]} {year}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="month-nav-btn" onClick={() => changeMonth(-1)}>◀</button>
          <div className="month-selector">{MONTHS[month - 1]} {year}</div>
          <button className="month-nav-btn" onClick={() => changeMonth(1)}>▶</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card green">
          <div className="stat-label">Monthly Allowance</div>
          <div className="stat-value">{fmt(allowance)}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{fmt(totalSpent)}</div>
          <div className="stat-sub">{allowance > 0 ? `${((totalSpent/allowance)*100).toFixed(1)}%` : '—'}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Needs Spent</div>
          <div className="stat-value">{fmt(needsSpent)}</div>
          <div className="stat-sub">Budget: {fmt(needsBudget)}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Wants Spent</div>
          <div className="stat-value">{fmt(wantsSpent)}</div>
          <div className="stat-sub">Budget: {fmt(wantsBudget)}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ padding: '60px' }}>
          <div className="spinner dark" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="charts-grid">
            {/* Doughnut Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🍩 Needs vs Wants Split</span>
              </div>
              <div className="card-body">
                {totalSpent === 0 ? (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-title">No data yet</div>
                    <div className="empty-state-desc">Add transactions to see your spending breakdown.</div>
                  </div>
                ) : (
                  <div className="chart-container">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                )}
              </div>
            </div>

            {/* Line Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📈 Savings Trend This Month</span>
              </div>
              <div className="card-body">
                {totalSpent === 0 ? (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-state-icon">📈</div>
                    <div className="empty-state-title">No trend data yet</div>
                    <div className="empty-state-desc">Log expenses to track your savings over time.</div>
                  </div>
                ) : (
                  <div className="chart-container">
                    <Line data={lineData} options={lineOptions} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '4px' }}>
            {/* Needs Breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🍱 Needs Breakdown</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{fmt(needsSpent)}</span>
              </div>
              <div className="card-body">
                {needsCategories.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No needs expenses logged.</p>
                ) : (
                  <ul className="category-list">
                    {needsCategories.map((cat, i) => (
                      <li key={cat.subcategory} className="category-item">
                        <div className="category-dot" style={{ background: NEEDS_COLORS[i % NEEDS_COLORS.length] }} />
                        <span className="category-name">{cat.subcategory}</span>
                        <span className="category-amount" style={{ color: 'var(--primary)' }}>{fmt(cat.total)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          ({needsSpent > 0 ? ((cat.total / needsSpent) * 100).toFixed(0) : 0}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Wants Breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🎉 Wants Breakdown</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary-dark)', fontWeight: 600 }}>{fmt(wantsSpent)}</span>
              </div>
              <div className="card-body">
                {wantsCategories.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No wants expenses logged.</p>
                ) : (
                  <ul className="category-list">
                    {wantsCategories.map((cat, i) => (
                      <li key={cat.subcategory} className="category-item">
                        <div className="category-dot" style={{ background: WANTS_COLORS[i % WANTS_COLORS.length] }} />
                        <span className="category-name">{cat.subcategory}</span>
                        <span className="category-amount" style={{ color: '#92400e' }}>{fmt(cat.total)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          ({wantsSpent > 0 ? ((cat.total / wantsSpent) * 100).toFixed(0) : 0}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

