import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";

const TITLE = "SalonGo — Look good. Feel great.";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = `Page not found — ${TITLE}`;
    return () => {
      document.title = TITLE;
    };
  }, []);

  return (
    <main id="main" className="section page-pad page-narrow not-found-page">
      <PageBackBar to="/home" label="Home" />
      <div className="not-found-page__badge" aria-hidden>
        404
      </div>
      <h1 className="page-title">Page not found</h1>
      <p className="page-subtitle">That URL does not exist or was moved.</p>
      <div className="stack-gap" style={{ marginTop: "1.5rem" }}>
        <Link to="/home" className="btn btn--gradient btn--wide">
          Go to home
        </Link>
        <Link to="/nearby" className="btn btn--ghost btn--wide">
          Explore salons
        </Link>
      </div>
    </main>
  );
}
