import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiAdminDashboard, type AdminDashboard } from "../../api/client";
import { AdminBarChart, AdminDonut } from "../../components/admin/AdminCharts";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminAlert, AdminPanel, AdminStatCard } from "../../components/admin/AdminUi";
import { useAuth } from "../../context/AuthContext";

function inrFromPaise(paise: number) {
  return (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    setLoading(true);
    try {
      const d = await apiAdminDashboard(token);
      setDash(d);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const mix = dash?.subscriptionMix ?? [];
  const byDay = dash?.appointmentsByDay ?? [];
  const typeMix = dash?.businessTypeMix ?? [];
  const ops = dash?.opsHealth ?? [];

  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="Platform overview"
        subtitle="Live tenants, subscriptions, bookings, and ops health across SlotNexa."
        actions={
          <button type="button" className="btn btn--ghost btn--small" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {err ? <AdminAlert>{err}</AdminAlert> : null}

      {dash && (
        <>
          {(dash.platformPulseNote || dash.revenueNote) && (
            <p className="sa-pulse">{dash.platformPulseNote || dash.revenueNote}</p>
          )}

          <div className="sa-stats">
            <AdminStatCard index={0} tone="gold" label="Tenants" value={dash.totalTenants} hint={`${dash.tenantsInTrial} in trial`} />
            <AdminStatCard
              index={1}
              tone="teal"
              label="Active subscriptions"
              value={dash.tenantsActiveSubscription}
              hint={`${dash.suspendedTenants} suspended`}
            />
            <AdminStatCard
              index={2}
              tone="gold"
              label="Est. MRR (₹)"
              value={inrFromPaise(dash.estimatedMonthlyRecurringPaise)}
              hint={`${dash.pendingPlatformPayments} payments pending`}
            />
            <AdminStatCard
              index={3}
              tone="rose"
              label="Appointments (7d)"
              value={dash.appointmentsLast7Days ?? "—"}
              hint={`${dash.totalCustomerAccounts ?? "—"} customers`}
            />
            <AdminStatCard
              index={4}
              tone="teal"
              label="Staff across tenants"
              value={dash.totalStaffMembers ?? "—"}
              hint={`${dash.totalActiveServiceOfferings ?? "—"} active services`}
            />
            <AdminStatCard
              index={5}
              tone="slate"
              label="Owner accounts"
              value={dash.tenantOwnerAccounts}
              hint={`${dash.tenantsMissingGeo ?? 0} missing map pin`}
            />
            <AdminStatCard
              index={6}
              tone="rose"
              label="No active services"
              value={dash.tenantsWithNoActiveServices ?? 0}
              hint="Onboarding gaps"
            />
            <AdminStatCard
              index={7}
              tone="gold"
              label="On discovery map"
              value={dash.tenantsWithGeoMapped ?? 0}
              hint="Geo-ready tenants"
            />
          </div>

          <div className="sa-grid-2">
            <AdminPanel title="Bookings this week" subtitle="Appointments started per day (UTC)">
              {byDay.length ? (
                <AdminBarChart points={byDay} accent="gold" height={180} />
              ) : (
                <p className="text-muted">No appointment series yet.</p>
              )}
            </AdminPanel>
            <AdminPanel title="Subscription mix" subtitle="Trial vs paid vs suspended">
              {mix.length ? (
                <AdminDonut points={mix} centerValue={dash.totalTenants} centerLabel="tenants" />
              ) : (
                <p className="text-muted">No subscription mix yet.</p>
              )}
            </AdminPanel>
          </div>

          <div className="sa-grid-2">
            <AdminPanel title="Business types" subtitle="How the platform is split">
              {typeMix.length ? <AdminBarChart points={typeMix} accent="teal" height={150} /> : null}
            </AdminPanel>
            <AdminPanel title="Ops health" subtitle="Coverage and volume signals">
              {ops.length ? <AdminBarChart points={ops} accent="rose" height={150} /> : null}
              <p className="sa-note">{dash.revenueNote}</p>
            </AdminPanel>
          </div>

          <AdminPanel title="Quick actions" subtitle="Jump into the most common operator tasks">
            <div className="sa-quick">
              <Link to="/admin/tenants" className="sa-tile" style={{ animationDelay: "0ms" }}>
                <strong>Manage tenants</strong>
                <span>Provision salons &amp; clinics, suspend, activate</span>
              </Link>
              <Link to="/admin/users" className="sa-tile" style={{ animationDelay: "40ms" }}>
                <strong>End users</strong>
                <span>Customers and account roles</span>
              </Link>
              <Link to="/admin/payments" className="sa-tile" style={{ animationDelay: "80ms" }}>
                <strong>Platform payments</strong>
                <span>SaaS billing queue</span>
              </Link>
              <Link to="/admin/system" className="sa-tile" style={{ animationDelay: "120ms" }}>
                <strong>System &amp; AI</strong>
                <span>Models, flags, and ops</span>
              </Link>
            </div>
          </AdminPanel>
        </>
      )}

      {!dash && !err && loading ? <p className="text-muted">Loading platform metrics…</p> : null}
    </main>
  );
}
