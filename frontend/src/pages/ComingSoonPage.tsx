import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";

type Props = {
  title?: string;
  feature?: string;
  backTo?: string;
  backLabel?: string;
};

/** Professional gate for unfinished product surfaces. */
export default function ComingSoonPage({
  title = "Coming soon",
  feature = "This module",
  backTo = "/",
  backLabel = "Home",
}: Props) {
  return (
    <main id="main" className="section page-pad">
      <div className="page-narrow">
        <PageBackBar to={backTo} label={backLabel} />
        <div className="surface-card glass-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="sa-page-header__eyebrow" style={{ marginBottom: "0.5rem" }}>
            SlotNexa roadmap
          </p>
          <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
            {title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0 auto 1.25rem" }}>
            {feature} is not enabled in this release. Core booking, staff, and admin flows are live — this area will unlock
            when the API and billing are production-ready.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", justifyContent: "center" }}>
            <Link className="btn btn--gold" to={backTo}>
              Back to {backLabel.toLowerCase()}
            </Link>
            <Link className="btn btn--ghost" to="/help">
              Help &amp; launch checklist
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
