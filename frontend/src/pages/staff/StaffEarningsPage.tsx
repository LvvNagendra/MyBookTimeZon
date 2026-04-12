import { Link } from "react-router-dom";
import { STAFF_EARNINGS } from "../../data/dummy";

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function StaffEarningsPage() {
  const e = STAFF_EARNINGS;
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/staff/schedule">Schedule</Link>
      </p>
      <h1 className="page-title">Earnings</h1>
      <p className="page-subtitle">Payout schedule — demo figures.</p>

      <div className="hub-stats">
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{rupees(e.weekPaise)}</span>
          <span className="hub-stat__label">This week</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{rupees(e.monthPaise)}</span>
          <span className="hub-stat__label">This month</span>
        </div>
      </div>
      <p className="surface-card">
        <strong>Next payout:</strong> {e.nextPayout}
      </p>
    </main>
  );
}
