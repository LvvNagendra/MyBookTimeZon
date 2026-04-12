import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";
import { HAIR_HEALTH_RESULT, NEARBY_SALONS } from "../data/dummy";

export default function HairHealthPage() {
  const h = HAIR_HEALTH_RESULT;
  return (
    <main id="main" className="section page-pad">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">Hair health analysis</h1>
        <p className="page-subtitle">Upload a scalp / hair photo — demo scores and tips (no API).</p>

        <div className="score-hero surface-card">
          <div>
            <p className="text-muted small">Your hair score</p>
            <p className="score-value">
              {h.score}
              <span className="score-max">/10</span>
            </p>
          </div>
          <div>
            <p className="text-muted small">Issues detected</p>
            <ul className="issue-list">
              {h.issues.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="section-block">
          <h2 className="section-heading">Care tips</h2>
          <ul className="tips-list">
            {h.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Suggested products</h2>
          <div className="product-grid">
            {h.products.map((p) => (
              <article key={p.name} className="surface-card product-card">
                <strong>{p.name}</strong>
                <p className="text-muted small">{p.note}</p>
                <span className="rating">★ {p.rating}</span>
              </article>
            ))}
          </div>
        </section>

        <Link className="btn btn--gold btn--wide" to={`/book/SALON/${NEARBY_SALONS[0].slug}`}>
          Book treatment nearby
        </Link>
      </div>
    </main>
  );
}
