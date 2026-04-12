import { Link } from "react-router-dom";

export function SiteFooter() {
  const isDev = import.meta.env.DEV;
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <h2>SalonGo</h2>
        <p>
          <strong>Customer</strong> discovery &amp; booking · <strong>Salon hub</strong> for owners · <strong>Staff</strong>{" "}
          schedule &amp; requests · <strong>Platform admin</strong> for tenants &amp; billing.
        </p>
        <p className="footer-links">
          <Link to="/help">Help</Link>
          <span aria-hidden> · </span>
          <Link to="/help#go-live">Launch checklist</Link>
          <span aria-hidden> · </span>
          <Link to="/help#privacy">Privacy</Link>
          <span aria-hidden> · </span>
          <Link to="/login">Sign in</Link>
          <span aria-hidden> · </span>
          <Link to="/nearby">Nearby salons</Link>
        </p>
        <p className="text-muted small">
          © {new Date().getFullYear()} SalonGo · Responsive · Light / dark theme
          {isDev ? " · Dev build (mock data)" : " · Set env VITE_API_BASE_URL to your API origin for production"}
        </p>
      </div>
    </footer>
  );
}
