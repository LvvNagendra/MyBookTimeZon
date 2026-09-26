import { Link } from "react-router-dom";
import { PORTFOLIO_ITEMS } from "../../data/dummy";

export default function StaffPortfolioPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/staff/schedule">Schedule</Link>
      </p>
      <h1 className="page-title">AI portfolio builder</h1>
      <p className="page-subtitle">Upload finished work — auto-tags help clients find you.</p>

      <button type="button" className="btn btn--gradient btn--wide" disabled style={{ marginBottom: "1.25rem" }}>
        Upload new photo
      </button>

      <div className="portfolio-grid">
        {PORTFOLIO_ITEMS.map((p) => (
          <article key={p.id} className="surface-card portfolio-tile">
            <div className="portfolio-tile__img" style={{ background: p.tone }} />
            <span className="badge badge--lav">AI: {p.tag}</span>
          </article>
        ))}
      </div>
    </main>
  );
}
