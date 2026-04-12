import { Link } from "react-router-dom";
import { ADMIN_PAYMENT_QUEUE } from "../../data/dummy";

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function AdminPaymentsPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/admin">Overview</Link>
      </p>
      <h1 className="page-title">Platform payments</h1>
      <p className="page-subtitle">SaaS subscription charges (Razorpay) — reconciliation UI placeholder.</p>

      <ul className="payment-queue">
        {ADMIN_PAYMENT_QUEUE.map((p) => (
          <li key={p.id} className="surface-card payment-row">
            <div>
              <strong>{p.tenant}</strong>
              <p className="text-muted small">{p.type}</p>
            </div>
            <div className="payment-row__amt">{rupees(p.amountPaise)}</div>
            <span className={`badge ${p.status === "Pending" ? "badge--pending" : "badge--ok"}`}>{p.status}</span>
            <button type="button" className="btn btn--ghost btn--small" disabled>
              Details
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
