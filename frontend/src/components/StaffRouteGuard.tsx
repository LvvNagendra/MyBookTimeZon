import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Stylist workspace — demo allows TENANT_ADMIN too so owners can preview. */
export function StaffRouteGuard({ children }: { children: React.ReactNode }) {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;

  if (!token) return <Navigate to="/login" replace />;
  if (!loading && role !== "STAFF" && role !== "TENANT_ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}
