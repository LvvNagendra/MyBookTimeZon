import { Link, useLocation } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";

export default function UnauthorizedPage() {
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;

  return (
    <main id="main" className="section page-pad page-narrow">
      <PageBackBar to="/home" label="Home" />
      <h1 className="page-title">Access denied</h1>
      <p className="page-subtitle">
        {from === "admin"
          ? "You need a super admin account to open the platform console."
          : "You don’t have permission to view this page."}
      </p>
      <div className="stack-gap">
        <Link to="/login" className="btn btn--gradient btn--wide">
          Sign in with another account
        </Link>
        <Link to="/" className="btn btn--ghost btn--wide">
          Back to home
        </Link>
      </div>
    </main>
  );
}
