import { useCallback, useEffect, useState } from "react";
import {
  apiAdminAssignSubscription,
  apiAdminDashboard,
  apiAdminTenants,
  apiMetaSaasPlans,
  type AdminDashboard,
  type ClinicRow,
  type SaasPlanOption,
} from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminAlert, AdminPanel, AdminStatusBadge } from "../../components/admin/AdminUi";
import { useAuth } from "../../context/AuthContext";

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [tenants, setTenants] = useState<ClinicRow[]>([]);
  const [plans, setPlans] = useState<SaasPlanOption[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [planPick, setPlanPick] = useState<Record<string, "BASIC" | "STANDARD" | "PREMIUM">>({});

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const [d, t] = await Promise.all([apiAdminDashboard(token), apiAdminTenants(token)]);
      setDash(d);
      setTenants(t);
      let p: SaasPlanOption[] = [];
      try {
        p = await apiMetaSaasPlans();
      } catch {
        p = [
          {
            code: "BASIC",
            label: "Basic",
            monthlyPaise: 49900,
            monthlyInrDisplay: "INR 499",
            trialDays: 14,
            description: "Core booking, staff, CRM",
          },
          {
            code: "STANDARD",
            label: "Standard",
            monthlyPaise: 99900,
            monthlyInrDisplay: "INR 999",
            trialDays: 14,
            description: "Growing businesses",
          },
          {
            code: "PREMIUM",
            label: "Premium",
            monthlyPaise: 149900,
            monthlyInrDisplay: "INR 1499",
            trialDays: 14,
            description: "Full platform pack",
          },
        ];
      }
      setPlans(p);
      const next: Record<string, "BASIC" | "STANDARD" | "PREMIUM"> = {};
      for (const row of t) {
        const code = (row.subscriptionPlan || "BASIC").toUpperCase();
        next[row.id] = code === "STANDARD" || code === "PREMIUM" ? code : "BASIC";
      }
      setPlanPick(next);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load billing");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sellPlan(clinicId: string) {
    if (!token) return;
    const plan = planPick[clinicId] ?? "BASIC";
    setBusyId(clinicId);
    setErr(null);
    try {
      await apiAdminAssignSubscription(token, clinicId, { plan, activate: true, status: "ACTIVE" });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not assign plan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="Subscriptions & payments"
        subtitle="Tenants can pay you manually (cash / UPI / bank). Use Activate below — no Razorpay required. Optional: add Razorpay keys later for online SaaS checkout."
      />

      {err ? <AdminAlert>{err}</AdminAlert> : null}

      {dash ? (
        <div className="sa-stats" style={{ marginBottom: "1.25rem" }}>
          <article className="sa-stat sa-stat--gold">
            <span className="sa-stat__label">Est. MRR</span>
            <strong className="sa-stat__value">{rupees(dash.estimatedMonthlyRecurringPaise)}</strong>
          </article>
          <article className="sa-stat sa-stat--teal">
            <span className="sa-stat__label">Active subs</span>
            <strong className="sa-stat__value">{dash.tenantsActiveSubscription}</strong>
          </article>
          <article className="sa-stat sa-stat--rose">
            <span className="sa-stat__label">Pending ledger</span>
            <strong className="sa-stat__value">{dash.pendingPlatformPayments}</strong>
          </article>
          <article className="sa-stat sa-stat--slate">
            <span className="sa-stat__label">In trial</span>
            <strong className="sa-stat__value">{dash.tenantsInTrial}</strong>
          </article>
        </div>
      ) : null}

      <AdminPanel title="Plan catalogue" subtitle="Loaded from /meta/saas-plans (dynamic)">
        <ul className="sa-list">
          {plans.map((p) => (
            <li key={p.code} className="sa-list__item">
              <div>
                <strong>
                  {p.label} · {p.monthlyInrDisplay}/mo
                </strong>
                <p className="sa-note">
                  {p.description} · {p.trialDays}-day trial
                </p>
              </div>
              <AdminStatusBadge status={p.code} />
            </li>
          ))}
        </ul>
      </AdminPanel>

      <div style={{ height: "1rem" }} />

      <AdminPanel
        title="Sell / activate tenants (manual OK)"
        subtitle="Assign plan + Activate after you receive payment outside the app — bank transfer, cash, or any account. Razorpay is optional."
      >
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Sector</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Sell</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.businessName}</strong>
                    <div className="text-muted small">{t.slug}</div>
                  </td>
                  <td>{t.businessType}</td>
                  <td>
                    <AdminStatusBadge status={t.tenantSuspended ? "SUSPENDED" : t.subscriptionStatus} />
                  </td>
                  <td>
                    <select
                      className="select-input"
                      value={planPick[t.id] ?? "BASIC"}
                      onChange={(e) =>
                        setPlanPick((prev) => ({
                          ...prev,
                          [t.id]: e.target.value as "BASIC" | "STANDARD" | "PREMIUM",
                        }))
                      }
                    >
                      {plans.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.label} ({p.monthlyInrDisplay})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--gold btn--small"
                      disabled={busyId === t.id}
                      onClick={() => void sellPlan(t.id)}
                    >
                      {busyId === t.id ? "…" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sa-note">
          Tenant self-serve: Business hub → Overview → choose plan → preview checkout → Confirm. Webhook:{" "}
          <code>POST /api/v1/webhooks/razorpay</code> with <code>{`{"ledgerId":"…"}`}</code>.
        </p>
      </AdminPanel>
    </main>
  );
}
