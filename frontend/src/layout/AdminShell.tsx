import { NavLink, Outlet } from "react-router-dom";
import { AdminRouteGuard } from "../components/AdminRouteGuard";

const nav = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/tenants", label: "Tenants" },
  { to: "/admin/users", label: "End users" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/system", label: "System & AI" },
];

export default function AdminShell() {
  return (
    <AdminRouteGuard>
      <div className="hub-shell hub-shell--admin">
        <aside className="hub-shell__aside" aria-label="Platform admin">
          <p className="hub-shell__label">Super admin</p>
          <nav className="hub-shell__nav">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `hub-nav-link${isActive ? " hub-nav-link--active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="hub-shell__main">
          <Outlet />
        </div>
      </div>
    </AdminRouteGuard>
  );
}
