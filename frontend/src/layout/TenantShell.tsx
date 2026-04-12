import { NavLink, Outlet } from "react-router-dom";
import { TenantRouteGuard } from "../components/TenantRouteGuard";

const nav = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/services", label: "Services" },
  { to: "/dashboard/staff", label: "Staff" },
  { to: "/dashboard/bookings", label: "Bookings" },
  { to: "/dashboard/analytics", label: "Analytics" },
  { to: "/dashboard/customers", label: "Customers" },
  { to: "/dashboard/portfolio", label: "AI portfolio" },
  { to: "/dashboard/products", label: "Products" },
  { to: "/dashboard/trending", label: "Trending looks" },
  { to: "/dashboard/settings", label: "Settings" },
];

export default function TenantShell() {
  return (
    <TenantRouteGuard>
      <div className="hub-shell hub-shell--tenant">
        <aside className="hub-shell__aside" aria-label="Salon owner navigation">
          <p className="hub-shell__label">Salon owner</p>
          <nav className="hub-shell__nav">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `hub-nav-link${isActive ? " hub-nav-link--active" : ""}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="hub-shell__main">
          <Outlet />
        </div>
      </div>
    </TenantRouteGuard>
  );
}
