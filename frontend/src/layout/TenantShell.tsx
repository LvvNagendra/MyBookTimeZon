import { NavLink, Outlet } from "react-router-dom";
import { TenantRouteGuard } from "../components/TenantRouteGuard";
import { useAuth } from "../context/AuthContext";
import { hasModule, hasPermission } from "../utils/permissions";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  module?: string;
  permission?: string;
  /** Hide unfinished product surfaces from the live sidebar */
  comingSoon?: boolean;
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/services", label: "Services", module: "booking", permission: "tenant.services.write" },
  { to: "/dashboard/staff", label: "Employees", module: "staff", permission: "tenant.staff.write" },
  { to: "/dashboard/bookings", label: "Bookings", module: "booking", permission: "tenant.bookings.read" },
  { to: "/dashboard/customers", label: "Customers", module: "crm", permission: "tenant.crm.read" },
  { to: "/dashboard/trending", label: "Trending looks", module: "trending", permission: "tenant.trending.write" },
  { to: "/dashboard/settings", label: "Settings", permission: "tenant.settings.write" },
  // Gated — demos only until APIs ship
  { to: "/dashboard/analytics", label: "Analytics", module: "analytics", permission: "tenant.analytics.read", comingSoon: true },
  { to: "/dashboard/portfolio", label: "AI portfolio", module: "portfolio", permission: "tenant.portfolio.write", comingSoon: true },
  { to: "/dashboard/products", label: "Products", module: "inventory", permission: "tenant.inventory.write", comingSoon: true },
];

export default function TenantShell() {
  const { profile } = useAuth();
  const isStaff = profile?.user.role === "STAFF";
  const items = nav.filter((item) => {
    if (item.comingSoon) return false;
    if (item.module && !hasModule(profile, item.module)) return false;
    if (item.permission && isStaff && !hasPermission(profile, item.permission)) return false;
    return true;
  });

  return (
    <TenantRouteGuard>
      <div className="hub-shell hub-shell--tenant">
        <aside className="hub-shell__aside" aria-label="Business owner navigation">
          <p className="hub-shell__label">Business Admin</p>
          <nav className="hub-shell__nav">
            {items.map((item) => (
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
          <p className="hub-shell__soon text-muted small">
            Analytics, portfolio &amp; retail inventory — coming soon
          </p>
        </aside>
        <div className="hub-shell__main">
          <Outlet />
        </div>
      </div>
    </TenantRouteGuard>
  );
}
