import { Link } from "react-router-dom";
import { PORTFOLIO_ITEMS } from "../../data/dummy";

export default function TenantPortfolioPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">AI style portfolio</h1>
      <p className="page-subtitle">Upload looks — AI tags (fade, bridal, facial) for customer discovery.</p>

      <div className="surface-card glass-card section-block">
        <h2 className="section-heading">Upload</h2>
        <p className="text-muted small">Demo — no file upload yet.</p>
        <button type="button" className="btn btn--gradient btn--wide" disabled>
          Add photos
        </button>
      </div>

      <div className="portfolio-grid">
        {PORTFOLIO_ITEMS.map((p) => (
          <article key={p.id} className="surface-card portfolio-tile">
            <div className="portfolio-tile__img" style={{ background: p.tone }} />
            <span className="badge badge--lav">{p.tag}</span>
          </article>
        ))}
      </div>
    </main>
  );
}
