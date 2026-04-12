import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath } from "../utils/roleHome";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `mobile-nav__link${isActive ? " mobile-nav__link--active" : ""}`;

export function MobileNav() {
  const { token, profile } = useAuth();
  const role = profile?.user.role;
  const workspace = role ? getRoleHomePath(role) : "/home";

  if (token && role === "SUPER_ADMIN") {
    return (
      <nav className="mobile-nav" aria-label="Primary">
        <NavLink to={workspace} className={linkClass}>
          Platform
        </NavLink>
        <NavLink to="/home" className={linkClass}>
          Discover
        </NavLink>
        <NavLink to="/admin/tenants" className={linkClass}>
          Tenants
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>
      </nav>
    );
  }

  if (token && (role === "TENANT_ADMIN" || role === "CLINIC_ADMIN")) {
    return (
      <nav className="mobile-nav" aria-label="Primary">
        <NavLink to={workspace} className={linkClass}>
          Hub
        </NavLink>
        <NavLink to="/home" className={linkClass}>
          Discover
        </NavLink>
        <NavLink to="/dashboard/bookings" className={linkClass}>
          Bookings
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>
      </nav>
    );
  }

  if (token && role === "STAFF") {
    return (
      <nav className="mobile-nav" aria-label="Primary">
        <NavLink to={workspace} className={linkClass}>
          Work
        </NavLink>
        <NavLink to="/home" className={linkClass}>
          Discover
        </NavLink>
        <NavLink to="/staff/requests" className={linkClass}>
          Requests
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>
      </nav>
    );
  }

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <NavLink to="/home" end className={linkClass}>
        Home
      </NavLink>
      <NavLink to="/ai-hair" className={linkClass}>
        AI
      </NavLink>
      <NavLink to="/my-bookings" className={linkClass}>
        Bookings
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        Profile
      </NavLink>
    </nav>
  );
}
