import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath, isCustomerRole } from "../utils/roleHome";
import HomePage from "./HomePage";

const INTRO_KEY = "salongo_intro_done";

/**
 * Entry for `/` and `/home`: splash for first-time guests, role-based redirect when signed in,
 * discovery home for guests and customers.
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

  if (typeof localStorage !== "undefined" && !localStorage.getItem(INTRO_KEY)) {
    return <Navigate to="/splash" replace />;
  }

  return <HomePage />;
}
