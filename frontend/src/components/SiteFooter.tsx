import { Link } from "react-router-dom";
import { BrandLogo, BRAND_NAME } from "./BrandLogo";

export function SiteFooter() {
  const isDev = import.meta.env.DEV;
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <BrandLogo size="sm" />
        </div>
        <p>
          <strong>{BRAND_NAME}</strong> — multi-tenant booking for salons &amp; clinics. Customers book live slots;
          Business Admins run employees, services, and CRM; Platform Admin manages every tenant.
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
          <Link to="/nearby">Explore</Link>
        </p>
        <p className="text-muted small">
          © {new Date().getFullYear()} {BRAND_NAME} · Web &amp; Android-ready · Light / dark
          {isDev ? " · Dev build" : ""}
        </p>
      </div>
    </footer>
  );
}
