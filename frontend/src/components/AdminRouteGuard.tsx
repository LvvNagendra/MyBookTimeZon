import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { token, profile, loading } = useAuth();

  if (!token) return <Navigate to="/login" replace state={{ from: "admin" }} />;
  if (loading) {
    return (
      <main className="section hub-page">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }
  if (profile?.user.role !== "SUPER_ADMIN") return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
