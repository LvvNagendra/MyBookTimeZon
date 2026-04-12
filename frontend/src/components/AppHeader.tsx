import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { getRoleHomePath } from "../utils/roleHome";

export function AppHeader() {
  const { token, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { mode, toggle } = useTheme();
  const role = profile?.user.role;
  const signedIn = Boolean(token);
  const brandTo = signedIn && role ? getRoleHomePath(role) : "/home";

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Link to={brandTo} className="brand" aria-label="SalonGo home">
          <span className="brand__mark" aria-hidden>
            SG
          </span>
          <span>SalonGo</span>
        </Link>
        <nav className="nav-actions" aria-label="Main">
          <button type="button" className="theme-toggle" onClick={toggle} aria-label={mode === "dark" ? "Light mode" : "Dark mode"}>
            {mode === "dark" ? "☀" : "☾"}
          </button>
          <Link to="/nearby">Nearby</Link>
          <Link to="/ai-hair">AI</Link>
          <Link to="/coach">Coach</Link>
          <Link to="/help">Help</Link>
          {signedIn && role === "SUPER_ADMIN" && (
            <Link to="/admin/tenants" className="btn btn--ghost btn--small">
              Tenants
            </Link>
          )}
          {signedIn && (role === "TENANT_ADMIN" || role === "CLINIC_ADMIN") && (
            <Link to="/dashboard" className="btn btn--ghost btn--small">
              Salon hub
            </Link>
          )}
          {signedIn && role === "STAFF" && (
            <Link to="/staff/schedule" className="btn btn--ghost btn--small">
              Staff schedule
            </Link>
          )}
          {signedIn && role === "CUSTOMER" && (
            <Link to="/my-bookings" className="btn btn--ghost btn--small">
              Bookings
            </Link>
          )}
          {signedIn ? (
            <button
              type="button"
              className="btn btn--gold btn--small"
              onClick={() => {
                signOut();
                navigate("/home");
              }}
            >
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--small">
                Sign in
              </Link>
              <Link to="/login" className="btn btn--gold btn--small">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
