import { NavLink, Outlet } from "react-router-dom";
import { StaffRouteGuard } from "../components/StaffRouteGuard";

const nav = [
  { to: "/staff/schedule", label: "Schedule" },
  { to: "/staff/requests", label: "Style requests" },
  { to: "/staff/portfolio", label: "Portfolio" },
  { to: "/staff/earnings", label: "Earnings" },
  { to: "/staff/availability", label: "Availability" },
];

export default function StaffShell() {
  return (
    <StaffRouteGuard>
      <div className="hub-shell hub-shell--staff">
        <aside className="hub-shell__aside" aria-label="Professional navigation">
          <p className="hub-shell__label">Professional</p>
          <nav className="hub-shell__nav">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `hub-nav-link${isActive ? " hub-nav-link--active" : ""}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="hub-shell__main">
          <Outlet />
        </div>
      </div>
    </StaffRouteGuard>
  );
}
