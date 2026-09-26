import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { roleDisplayName } from "../../utils/roleLabels";

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

type Appt = {
  id: string;
  startAt: string;
  customerName?: string;
  serviceName?: string;
  staffName?: string;
  status?: string;
};

export default function TenantOverviewPage() {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;
  const clinicId = profile?.clinic?.id ?? null;
  const [types, setTypes] = useState<BusinessTypeOption[]>([]);
  const [newType, setNewType] = useState("");
  const [svcCount, setSvcCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [appts, setAppts] = useState<Appt[]>([]);
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
      setAppts(ap as Appt[]);
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

  const todayAppts = useMemo(() => {
    const today = new Date().toDateString();
    return appts
      .filter((a) => a.status !== "CANCELLED" && new Date(a.startAt).toDateString() === today)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appts]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appts
      .filter((a) => a.status !== "CANCELLED" && new Date(a.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [appts]);

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

  if (loading && !profile)
    return (
      <main className="section hub-page">
        <p className="text-muted">Loading…</p>
      </main>
    );

  const isClinic = profile?.clinic?.businessType === "CLINIC";

  return (
    <main id="main" className="section hub-page tenant-overview">
      <p className="text-muted">
        <Link to="/home">Customer app</Link> · Signed in as {roleDisplayName(role)}
      </p>
      <h1 className="page-title">Admin dashboard</h1>
      {profile?.clinic && (
        <p className="page-subtitle">
          {profile.clinic.logoUrl ? (
            <img
              src={profile.clinic.logoUrl}
              alt=""
              width={40}
              height={40}
              style={{ borderRadius: 10, verticalAlign: "middle", marginRight: 10, objectFit: "cover" }}
            />
          ) : null}
          <strong>{profile.clinic.businessName}</strong> · tenant{" "}
          <code className="text-muted">{profile.clinic.id.slice(0, 8)}…</code> ·{" "}
          <Link to={`/book/${profile.clinic.businessType}/${profile.clinic.slug}`}>Public booking</Link>
        </p>
      )}
      {err && (
        <div className="alert alert--error" role="alert">
          {err}
        </div>
      )}

      <div className="hub-stats">
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{todayAppts.length}</span>
          <span className="hub-stat__label">Today&apos;s bookings</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{upcoming.length}</span>
          <span className="hub-stat__label">Upcoming (next 5)</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{staffCount}</span>
          <span className="hub-stat__label">{isClinic ? "Doctors / staff" : "Employees"}</span>
        </div>
        <div className="surface-card hub-stat glass-card">
          <span className="hub-stat__value">{svcCount}</span>
          <span className="hub-stat__label">Services</span>
        </div>
      </div>

      {profile?.clinic && (
        <section className="surface-card glass-card tenant-setup-checklist">
          <h2 className="section-heading" style={{ marginTop: 0 }}>
            Setup checklist
          </h2>
          <p className="text-muted small">
            Multi-tenant isolation: all data is scoped to your <code>clinic_id</code> only.
          </p>
          <ul className="tenant-checklist">
            <li className={profile.clinic.logoUrl ? "is-done" : ""}>
              <Link to="/dashboard/settings">Business logo &amp; hours</Link>
            </li>
            <li className={profile.clinic.latitude != null ? "is-done" : ""}>
              <Link to="/dashboard/settings">Location / map pin</Link>
            </li>
            <li className={svcCount > 0 ? "is-done" : ""}>
              <Link to="/dashboard/services">Services (duration → slots)</Link>
            </li>
            <li className={staffCount > 0 ? "is-done" : ""}>
              <Link to="/dashboard/staff">Employees &amp; availability</Link>
            </li>
            <li>
              <Link to="/dashboard/customers">CRM customers</Link>
            </li>
          </ul>
        </section>
      )}

      <section className="section-block">
        <div className="section-row">
          <h2 className="section-heading">Today&apos;s schedule</h2>
          <Link to="/dashboard/bookings" className="link-customer">
            Manage all
          </Link>
        </div>
        {todayAppts.length === 0 ? (
          <p className="text-muted">No bookings today yet.</p>
        ) : (
          <ul className="schedule-list">
            {todayAppts.map((a) => (
              <li key={a.id} className="surface-card schedule-card glass-card">
                <div>
                  <strong>
                    {new Date(a.startAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </strong>
                  <p className="text-muted small">
                    {a.customerName || "Guest"} · {a.serviceName} · {a.staffName}
                  </p>
                </div>
                <span className="badge badge--lav">{a.status || "CONFIRMED"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="hub-quick">
        <Link to="/dashboard/bookings" className="surface-card hub-tile">
          <strong>Appointments</strong>
          <span className="text-muted small">Confirm · reassign · complete · no-show</span>
        </Link>
        <Link to="/dashboard/staff" className="surface-card hub-tile">
          <strong>Employees</strong>
          <span className="text-muted small">Doctor / stylist hours &amp; login</span>
        </Link>
        <Link to="/dashboard/customers" className="surface-card hub-tile">
          <strong>Customers</strong>
          <span className="text-muted small">Visits &amp; notes (CRM)</span>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="surface-card">
          <h2 className="section-heading">Business sector</h2>
          <p className="text-muted small">Salon, clinic, spa — drives public booking URL and modules.</p>
          <form onSubmit={saveCategory} className="stack" style={{ marginTop: "1rem" }}>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn--gold btn--small">
              Save sector
            </button>
          </form>
        </section>
        <section className="surface-card">
          <h2 className="section-heading">Online payments (optional)</h2>
          <p className="text-muted small">
            Default is <strong>pay at salon</strong> (cash / UPI / other accounts). Staff mark visits paid in Bookings.
            Enable only if you want Razorpay Checkout for customers.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--small btn--gold" onClick={() => void toggleOnlinePay(true)}>
              Enable Razorpay path
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => void toggleOnlinePay(false)}>
              Keep pay-at-salon only
            </button>
          </div>
        </section>
      </div>

      {(role === "TENANT_ADMIN" || role === "CLINIC_ADMIN") && (
        <section className="surface-card section-block">
          <h2 className="section-heading">Platform subscription</h2>
          <p className="preview-banner">
            Preview billing — prices from server <code>saas.*</code> properties. With Razorpay keys empty, use{" "}
            <strong>Confirm preview payment</strong> after choosing a plan (or ask Super Admin to Activate on Payments).
          </p>
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
              Confirm preview payment
            </button>
          </div>
          {billingMsg && <p className="text-muted small">{billingMsg}</p>}
        </section>
      )}
    </main>
  );
}
