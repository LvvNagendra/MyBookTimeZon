import { Link } from "react-router-dom";
import { TENANT_ANALYTICS } from "../../data/dummy";

export default function TenantAnalyticsPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Analytics</h1>
      <p className="page-subtitle">Weekly revenue, peak hours, repeat customers — demo charts.</p>

      <div className="surface-card glass-card section-block">
        <h2 className="section-heading">Revenue trend</h2>
        <div className="bar-chart" aria-hidden>
          {[40, 65, 55, 80, 70, 95, 88].map((h, i) => (
            <div key={i} className="bar-chart__col" style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="text-muted small">Last 7 days (mock)</p>
      </div>

      <div className="dash-grid">
        <section className="surface-card">
          <h2 className="section-heading">Top services</h2>
          <ul className="simple-list">
            {TENANT_ANALYTICS.topServices.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong> — {s.share}%
              </li>
            ))}
          </ul>
        </section>
        <section className="surface-card">
          <h2 className="section-heading">Operations</h2>
          <p>
            <strong>Peak hours:</strong> {TENANT_ANALYTICS.peakHours}
          </p>
          <p>
            <strong>Repeat customers:</strong> {TENANT_ANALYTICS.repeatCustomersPct}%
          </p>
        </section>
      </div>
    </main>
  );
}
