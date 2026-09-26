import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { MobileNav } from "../components/MobileNav";
import { SiteFooter } from "../components/SiteFooter";

export default function AppLayout() {
  const { pathname } = useLocation();
  const bare =
    pathname === "/splash" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/staff");

  const hideChrome = pathname.startsWith("/admin");

  const showMobileNav =
    !bare &&
    !pathname.startsWith("/book/") &&
    pathname !== "/splash" &&
    pathname !== "/onboarding";

  return (
    <div className={`app-shell${showMobileNav ? " app-shell--nav" : ""}`}>
      {!hideChrome && <AppHeader />}
      <div key={pathname} className="page-enter">
        <Outlet />
      </div>
      {showMobileNav && <MobileNav />}
      {!bare && <SiteFooter />}
    </div>
  );
}
