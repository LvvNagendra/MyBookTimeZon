import { Link } from "react-router-dom";
import { TENANT_APPOINTMENTS } from "../../data/dummy";

export default function StaffSchedulePage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/">Home</Link>
      </p>
      <h1 className="page-title">My schedule</h1>
      <p className="page-subtitle">Upcoming appointments — real-time updates when API is live.</p>

      <ul className="schedule-list">
        {TENANT_APPOINTMENTS.map((a) => (
          <li key={a.id} className="surface-card schedule-card glass-card">
            <div>
              <strong>{new Date(a.startAt).toLocaleString()}</strong>
              <p className="text-muted small">
                {a.customerName} · {a.serviceName}
              </p>
            </div>
            <span className="badge badge--lav">{a.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
