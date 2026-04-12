import { Link } from "react-router-dom";

export default function AdminSystemPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/admin">Overview</Link>
      </p>
      <h1 className="page-title">System & AI</h1>
      <p className="page-subtitle">Feature flags, model versions, and rate limits — connect to ops backend.</p>

      <div className="dash-grid">
        <section className="surface-card glass-card">
          <h2 className="section-heading">AI models</h2>
          <ul className="simple-list text-muted">
            <li>Hairstyle suggest — v2.1 (demo)</li>
            <li>Skin analysis — v1.4 (demo)</li>
            <li>Beauty coach LLM — gpt-style router (demo)</li>
          </ul>
          <button type="button" className="btn btn--ghost btn--small" disabled>
            Rotate model
          </button>
        </section>
        <section className="surface-card">
          <h2 className="section-heading">Feature flags</h2>
          <label className="flag-row">
            <input type="checkbox" defaultChecked disabled /> Live slot WebSocket
          </label>
          <label className="flag-row">
            <input type="checkbox" defaultChecked disabled /> Razorpay live mode
          </label>
          <label className="flag-row">
            <input type="checkbox" disabled /> Maintenance mode
          </label>
        </section>
      </div>
    </main>
  );
}
