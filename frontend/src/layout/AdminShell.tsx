import { NavLink, Outlet } from "react-router-dom";
import { AdminRouteGuard } from "../components/AdminRouteGuard";
import { BrandLogo, BRAND_NAME } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permissions";

const nav = [
  { to: "/admin", label: "Overview", end: true, icon: "◈", live: true },
  { to: "/admin/tenants", label: "Tenants", icon: "▣", live: true },
  { to: "/admin/users", label: "End users", icon: "◎", live: true },
  { to: "/admin/sectors", label: "Sectors", permission: "platform.catalog.manage", icon: "◫", live: true },
  { to: "/admin/roles", label: "Roles", permission: "platform.catalog.manage", icon: "⬡", live: true },
  { to: "/admin/payments", label: "Payments", icon: "₹", live: true },
  { to: "/admin/system", label: "System & AI", icon: "⚙", live: true },
];

export default function AdminShell() {
  const { profile, signOut } = useAuth();
  const items = nav.filter(
    (item) => item.live && (!item.permission || hasPermission(profile, item.permission)),
  );
  const name = profile?.user.name || profile?.user.email || "Admin";

  return (
    <AdminRouteGuard>
      <div className="sa-shell">
        <aside className="sa-sidebar" aria-label="Platform admin">
          <div className="sa-sidebar__brand">
            <BrandLogo size="sm" />
            <span className="sa-sidebar__badge">Super Admin</span>
          </div>
          <nav className="sa-sidebar__nav">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sa-nav-link${isActive ? " sa-nav-link--active" : ""}`}
              >
                <span className="sa-nav-link__icon" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sa-sidebar__foot">
            <p className="sa-sidebar__user">{name}</p>
            <button type="button" className="btn btn--ghost btn--small" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        <div className="sa-main">
          <div className="sa-topbar">
            <p className="sa-topbar__title">{BRAND_NAME} platform</p>
            <NavLink to="/home" className="sa-topbar__link">
              Customer discovery →
            </NavLink>
          </div>
          <div className="sa-content">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
