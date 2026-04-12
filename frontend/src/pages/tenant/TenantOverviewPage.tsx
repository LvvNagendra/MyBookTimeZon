import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiBusinessTypes,
  apiSaasCheckout,
  apiSaasConfirmMock,
  apiTenantAppointments,
  apiTenantServices,
  apiTenantStaff,
  apiUpdateClinic,
  type BusinessTypeOption,
} from "../../api/client";
import { TENANT_AI_INSIGHTS, TENANT_ANALYTICS } from "../../data/dummy";
import { useAuth } from "../../context/AuthContext";

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function TenantOverviewPage() {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;
  const clinicId = profile?.clinic?.id ?? null;
  const [types, setTypes] = useState<BusinessTypeOption[]>([]);
  const [newType, setNewType] = useState("");
  const [svcCount, setSvcCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [todayAppts, setTodayAppts] = useState(0);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [billingMsg, setBillingMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      const [sv, st, ap] = await Promise.all([
        apiTenantServices(token, clinicId),
        apiTenantStaff(token, clinicId),
        apiTenantAppointments(token, clinicId),
      ]);
      setSvcCount(sv.length);
      setStaffCount(st.length);
      const today = new Date().toDateString();
      setTodayAppts(
        (ap as { startAt: string }[]).filter((a) => new Date(a.startAt).toDateString() === today).length,
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [token, clinicId]);

  useEffect(() => {
    void apiBusinessTypes().then((t) => {
      setTypes(t);
      if (profile?.clinic?.businessType) setNewType(profile.clinic.businessType);
    });
  }, [profile?.clinic?.businessType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveCategory(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId || !newType) return;
    try {
      await apiUpdateClinic(token, clinicId, { businessType: newType });
      window.location.reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleOnlinePay(on: boolean) {
    if (!token || !clinicId) return;
    try {
      await apiUpdateClinic(token, clinicId, { onlinePaymentsEnabled: on });
      window.location.reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function subscribe(plan: "BASIC" | "STANDARD" | "PREMIUM") {
    if (!token || !clinicId) return;
    setBillingMsg(null);
    try {
      const c = await apiSaasCheckout(token, clinicId, plan);
      setLedgerId(c.ledgerId);
      setBillingMsg(`Order ${c.orderId} · ${rupees(c.amountPaise)} · ${c.message}`);
    } catch (e: unknown) {
      setBillingMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function confirmMock() {
    if (!token || !clinicId || !ledgerId) return;
    try {
      await apiSaasConfirmMock(token, clinicId, ledgerId);
      setBillingMsg("Subscription activated (mock).");
    } catch (e: unknown) {
      setBillingMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading && !profile) return <main className="section hub-page"><p className="text-muted">Loading…</p></main>;

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/home">Customer discovery</Link>
      </p>
      <h1 className="page-title">Overview</h1>
      {profile?.clinic && (
        <p className="page-subtitle">
          <strong>{profile.clinic.businessName}</strong> ·{" "}
          <Link to={`/book/${profile.clinic.businessType}/${profile.clinic.slug}`}>Public booking</Link>
        </p>
      )}
      {err && (
        <div className="alert alert--error" role="alert">
          {err}
        </div>
      )}

      <div className="surface-card glass-card tenant-reminder-note">
        <strong>Bookings &amp; customer mobiles</strong>
        <p className="text-muted small" style={{ margin: "0.5rem 0 0" }}>
          Each confirmed booking includes the customer&apos;s mobile for SMS/WhatsApp reminders (live API). Your staff see it on the
          appointment so they can reach out easily. Demo mode stores numbers only — no real messages yet.
        </p>
      </div>

      {profile?.clinic && (
        <section className="surface-card glass-card tenant-setup-checklist">
          <h2 className="section-heading" style={{ marginTop: 0 }}>
            Your shop setup
          </h2>
          <p className="text-muted small">
            Everything below uses <strong>your</strong> <code>clinicId</code> only — staff, services, and slots never mix with other
            salons on the platform.
          </p>
          <ul className="tenant-checklist">
            <li className={profile.clinic.latitude != null && profile.clinic.longitude != null ? "is-done" : ""}>
              <Link to="/dashboard/settings">Map pin &amp; address</Link> —{" "}
              {profile.clinic.latitude != null && profile.clinic.longitude != null
                ? "on discovery map"
                : "add coordinates so Nearby can find you"}
            </li>
            <li className={svcCount > 0 ? "is-done" : ""}>
              <Link to="/dashboard/services">Services catalogue</Link> — {svcCount > 0 ? `${svcCount} offering(s)` : "add bookable services"}
            </li>
            <li className={staffCount > 0 ? "is-done" : ""}>
              <Link to="/dashboard/staff">Staff roster</Link> — {staffCount > 0 ? `${staffCount} on roster` : "add stylists & weekly hours"}
            </li>
            <li>
              <Link to="/dashboard/bookings">Bookings</Link> — today: {todayAppts} on the calendar
            </li>
          </ul>
        </section>
      )}

      <div className="hub-stats">
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{todayAppts}</span>
          <span className="hub-stat__label">Today’s bookings</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{rupees(TENANT_ANALYTICS.weeklyRevenuePaise)}</span>
          <span className="hub-stat__label">Week revenue (demo)</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{staffCount}</span>
          <span className="hub-stat__label">Staff on roster</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{svcCount}</span>
          <span className="hub-stat__label">Active services</span>
        </div>
      </div>

      <section className="section-block">
        <h2 className="section-heading">AI business hints</h2>
        <ul className="insights-list">
          {TENANT_AI_INSIGHTS.map((t) => (
            <li key={t} className="surface-card insight-row">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="section-block">
        <h2 className="section-heading">This week (demo)</h2>
        <div className="surface-card analytics-mini">
          <p>
            <strong>Peak hours:</strong> {TENANT_ANALYTICS.peakHours}
          </p>
          <p>
            <strong>Repeat customers:</strong> {TENANT_ANALYTICS.repeatCustomersPct}%
          </p>
          <p className="text-muted small">Top: {TENANT_ANALYTICS.topServices.map((s) => `${s.name} (${s.share}%)`).join(" · ")}</p>
        </div>
      </section>

      <div className="hub-quick">
        <Link to="/dashboard/bookings" className="surface-card hub-tile">
          <strong>Manage bookings</strong>
          <span className="text-muted small">Accept · reschedule · no-show</span>
        </Link>
        <Link to="/dashboard/portfolio" className="surface-card hub-tile">
          <strong>AI style portfolio</strong>
          <span className="text-muted small">Tag cuts for discovery</span>
        </Link>
        <Link to="/dashboard/products" className="surface-card hub-tile">
          <strong>Retail products</strong>
          <span className="text-muted small">Show after hair analysis</span>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="surface-card">
          <h2 className="section-heading">Business category</h2>
          <p className="text-muted small">Multi-service ready — salon today, spa or clinic later.</p>
          <form onSubmit={saveCategory} className="stack" style={{ marginTop: "1rem" }}>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn--gradient btn--small">
              Save category
            </button>
          </form>
        </section>
        <section className="surface-card">
          <h2 className="section-heading">Online payments</h2>
          <p className="text-muted small">Razorpay / Stripe at checkout when enabled.</p>
          <div className="btn-row">
            <button type="button" className="btn btn--small btn--gradient" onClick={() => void toggleOnlinePay(true)}>
              Enable
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => void toggleOnlinePay(false)}>
              Disable
            </button>
          </div>
        </section>
      </div>

      {role === "TENANT_ADMIN" && (
        <section className="surface-card section-block">
          <h2 className="section-heading">Platform subscription</h2>
          <p className="text-muted small">Mock SaaS billing — swap for live keys later.</p>
          <div className="btn-row">
            <button type="button" className="btn btn--small" onClick={() => void subscribe("BASIC")}>
              Basic
            </button>
            <button type="button" className="btn btn--small" onClick={() => void subscribe("STANDARD")}>
              Standard
            </button>
            <button type="button" className="btn btn--small" onClick={() => void subscribe("PREMIUM")}>
              Premium
            </button>
            <button type="button" className="btn btn--ghost btn--small" disabled={!ledgerId} onClick={() => void confirmMock()}>
              Confirm mock
            </button>
          </div>
          {billingMsg && <p className="text-muted small">{billingMsg}</p>}
        </section>
      )}
    </main>
  );
}
