import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiMe } from "../api/client";
import { getRoleHomePath } from "../utils/roleHome";
import { AuthPanel } from "../components/AuthPanel";
import { PageBackBar } from "../components/PageBackBar";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { signIn, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main id="main" className="section page-pad auth-page">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">Welcome to SalonGo</h1>
        <p className="page-subtitle">
          Same login for all roles — you are redirected to the platform console, salon hub, staff workspace
          (<code>/staff/schedule</code>), or discovery home based on your account. Salon staff need a STAFF user linked to
          their clinic (not just a roster row).
        </p>
        <AuthPanel
          activeTab={tab}
          onTabChange={setTab}
          onAuthSuccess={async (accessToken) => {
            signIn(accessToken);
            const from = (location.state as { from?: string } | null)?.from;
            try {
              const me = await apiMe(accessToken);
              if (from === "admin" && me.user.role === "SUPER_ADMIN") {
                navigate("/admin", { replace: true });
                return;
              }
              if (from === "bookings") {
                if (me.user.role === "CUSTOMER") {
                  navigate("/my-bookings", { replace: true });
                  return;
                }
                navigate(getRoleHomePath(me.user.role), { replace: true });
                return;
              }
              navigate(getRoleHomePath(me.user.role), { replace: true });
            } catch {
              navigate("/", { replace: true });
            }
          }}
        />
      </div>
    </main>
  );
}
