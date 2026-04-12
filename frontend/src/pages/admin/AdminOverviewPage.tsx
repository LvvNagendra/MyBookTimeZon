import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiAdminDashboard, type AdminDashboard } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const d = await apiAdminDashboard(token);
      setDash(d);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/home">Customer discovery (same app)</Link>
      </p>
      <h1 className="page-title">Platform overview</h1>
      <p className="page-subtitle">Tenants, subscriptions, and revenue — demo data until API is live.</p>
      {err && <div className="alert alert--error">{err}</div>}

      {dash && (
        <>
          <div className="hub-stats">
            <div className="surface-card hub-stat glass-card">
              <span className="hub-stat__value">{dash.totalTenants}</span>
              <span className="hub-stat__label">Tenants</span>
            </div>
            <div className="surface-card hub-stat glass-card">
              <span className="hub-stat__value">{dash.tenantsInTrial}</span>
              <span className="hub-stat__label">In trial</span>
            </div>
            <div className="surface-card hub-stat glass-card">
              <span className="hub-stat__value">{dash.tenantsActiveSubscription}</span>
              <span className="hub-stat__label">Active subs</span>
            </div>
            <div className="surface-card hub-stat glass-card">
              <span className="hub-stat__value">{(dash.estimatedMonthlyRecurringPaise / 100).toLocaleString()}</span>
              <span className="hub-stat__label">Est. MRR (₹)</span>
            </div>
            <div className="surface-card hub-stat glass-card">
              <span className="hub-stat__value">{dash.suspendedTenants}</span>
              <span className="hub-stat__label">Suspended</span>
            </div>
            <div className="surface-card hub-stat glass-card">
              <span className="hub-stat__value">{dash.pendingPlatformPayments}</span>
              <span className="hub-stat__label">Pending payments</span>
            </div>
          </div>
          <p className="text-muted small section-block">{dash.revenueNote}</p>

          <div className="hub-quick">
            <Link to="/admin/tenants" className="surface-card hub-tile glass-card">
              <strong>Manage tenants</strong>
              <span className="text-muted small">Add salons (invite-only), suspend, activate</span>
            </Link>
            <Link to="/admin/users" className="surface-card hub-tile glass-card">
              <strong>End users</strong>
              <span className="text-muted small">Customers & accounts</span>
            </Link>
            <Link to="/admin/payments" className="surface-card hub-tile glass-card">
              <strong>Platform payments</strong>
              <span className="text-muted small">SaaS billing queue</span>
            </Link>
            <Link to="/admin/system" className="surface-card hub-tile glass-card">
              <strong>System & AI</strong>
              <span className="text-muted small">Models & flags</span>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
