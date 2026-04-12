import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";
import { SKIN_ANALYSIS_RESULT } from "../data/dummy";

export default function SkinFacialPage() {
  const s = SKIN_ANALYSIS_RESULT;
  return (
    <main id="main" className="section page-pad">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">Facial & skin coach</h1>
        <p className="page-subtitle">Face scan + LLM-style routine (demo copy — personalize later).</p>

        <div className="score-hero surface-card">
          <div>
            <p className="text-muted small">Skin score</p>
            <p className="score-value">
              {s.score}
              <span className="score-max">/10</span>
            </p>
            <p className="text-muted small">Type: {s.skinType}</p>
          </div>
          <div>
            <p className="text-muted small">Focus areas</p>
            <ul className="issue-list">
              {s.concerns.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="section-block">
          <h2 className="section-heading">Personalized routine</h2>
          <div className="surface-card coach-block">
            <p>{s.routine}</p>
          </div>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Diet & habits (demo)</h2>
          <div className="surface-card coach-block glass-card">
            <p>{s.dietTips}</p>
          </div>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Product ideas</h2>
          <div className="product-grid">
            {s.products.map((p) => (
              <article key={p.name} className="surface-card product-card">
                <strong>{p.name}</strong>
                <span className="rating">★ {p.rating}</span>
              </article>
            ))}
          </div>
        </section>

        <p className="surface-card facial-note">{s.facialSuggestion}</p>

        <Link className="btn btn--gradient btn--wide" to="/book/SALON/urban-trim">
          Book facial appointment
        </Link>
      </div>
    </main>
  );
}
