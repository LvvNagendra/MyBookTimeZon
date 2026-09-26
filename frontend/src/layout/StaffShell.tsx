import { NavLink, Outlet } from "react-router-dom";
import { StaffRouteGuard } from "../components/StaffRouteGuard";

const nav = [
  { to: "/staff/schedule", label: "Schedule", live: true },
  { to: "/staff/availability", label: "Availability", live: true },
  { to: "/staff/requests", label: "Style requests", live: false },
  { to: "/staff/portfolio", label: "Portfolio", live: false },
  { to: "/staff/earnings", label: "Earnings", live: false },
];

export default function StaffShell() {
  const live = nav.filter((n) => n.live);
  return (
    <StaffRouteGuard>
      <div className="hub-shell hub-shell--staff">
        <aside className="hub-shell__aside" aria-label="Professional navigation">
          <p className="hub-shell__label">Professional</p>
          <nav className="hub-shell__nav">
            {live.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `hub-nav-link${isActive ? " hub-nav-link--active" : ""}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <p className="hub-shell__soon text-muted small">Style requests, portfolio &amp; earnings — coming soon</p>
        </aside>
        <div className="hub-shell__main">
          <Outlet />
        </div>
      </div>
    </StaffRouteGuard>
  );
}
