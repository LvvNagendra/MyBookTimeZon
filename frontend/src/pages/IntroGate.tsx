import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath, isCustomerRole } from "../utils/roleHome";
import HomePage from "./HomePage";

/**
 * Entry for `/` and `/home`: role-based redirect when signed in as staff/owner/admin,
 * marketing + discovery home for guests and customers.
 */
export default function IntroGate() {
  const { token, profile, loading } = useAuth();

  if (token && loading) {
    return (
      <main id="main" className="section page-pad">
        <p className="text-muted">Loading your workspace…</p>
      </main>
    );
  }

  if (token && profile) {
    if (!isCustomerRole(profile.user.role)) {
      return <Navigate to={getRoleHomePath(profile.user.role)} replace />;
    }
    return <HomePage />;
  }

  return <HomePage />;
}
