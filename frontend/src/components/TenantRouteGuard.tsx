import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function TenantRouteGuard({ children }: { children: React.ReactNode }) {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;
  const clinicId = profile?.clinic?.id ?? null;

  if (!token) return <Navigate to="/login" replace />;
  if (!loading && role && role !== "TENANT_ADMIN" && role !== "STAFF") return <Navigate to="/" replace />;
  if (!loading && !clinicId) return <Navigate to="/" replace />;

  return <>{children}</>;
}
