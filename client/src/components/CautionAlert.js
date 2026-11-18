const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function CautionAlert({ level, savingsPct, totalSaved, wantsBudget, wantsSpent, daysLeft }) {
  const wantsRemaining = wantsBudget - wantsSpent;
  const wantsRemainingPct = wantsBudget > 0 ? (wantsRemaining / wantsBudget) * 100 : 100;

  const isDanger = level === 'danger';

  const getTitle = () => {
    if (totalSaved < 0) return '🚨 Budget Exceeded!';
    if (savingsPct < 10) return '🚨 Critical: Almost Out of Money!';
    if (savingsPct < 20) return '⚠️ Low Savings Alert';
    if (wantsRemainingPct < 15) return '⚠️ Wants Budget Running Low';
    return '⚠️ Spending Caution';
  };

  const getMessage = () => {
    const parts = [];

    if (totalSaved < 0) {
      parts.push(`You've overspent your monthly allowance by ${fmt(Math.abs(totalSaved))}.`);
    } else if (savingsPct < 20) {
      parts.push(`Only ${savingsPct.toFixed(1)}% (${fmt(totalSaved)}) of your allowance remains.`);
    }

    if (wantsRemainingPct < 20 && wantsBudget > 0) {
      parts.push(`Your 🎉 Wants bucket has only ${fmt(Math.max(wantsRemaining, 0))} left (${Math.max(wantsRemainingPct, 0).toFixed(0)}%).`);
    }

    if (daysLeft > 0) {
      const dailyBudget = totalSaved > 0 ? (totalSaved / daysLeft) : 0;
      parts.push(`${daysLeft} days remaining — try to stay within ${fmt(dailyBudget)}/day.`);
    }

    return parts.join(' ');
  };

  return (
    <div className={`caution-alert ${level}`}>
      <div className="caution-icon">{isDanger ? '🚨' : '⚠️'}</div>
      <div className="caution-content">
        <h4>{getTitle()}</h4>
        <p>{getMessage()}</p>
      </div>
    </div>
  );
}

