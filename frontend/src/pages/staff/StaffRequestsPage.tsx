import { Link } from "react-router-dom";
import { STAFF_REQUESTS } from "../../data/dummy";

export default function StaffRequestsPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/staff/schedule">Schedule</Link>
      </p>
      <h1 className="page-title">Style matching requests</h1>
      <p className="page-subtitle">Customer photos & notes before the chair.</p>

      <ul className="request-list">
        {STAFF_REQUESTS.map((r) => (
          <li key={r.id} className="surface-card request-card">
            <div className="request-card__head">
              <strong>{r.customer}</strong>
              <span className="badge badge--muted">{r.difficulty}</span>
            </div>
            <p className="text-muted small">{r.hairType}</p>
            <p>{r.request}</p>
            <p className="text-muted small">{r.time}</p>
            <div className="btn-row">
              <button type="button" className="btn btn--small btn--gradient" disabled>
                Accept
              </button>
              <button type="button" className="btn btn--ghost btn--small" disabled>
                Propose time
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
