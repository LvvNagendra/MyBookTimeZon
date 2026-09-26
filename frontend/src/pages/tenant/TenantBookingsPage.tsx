import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiTenantAppointments,
  apiTenantCancelAppointment,
  apiTenantMarkAppointmentPaid,
  apiTenantReassignAppointment,
  apiTenantStaff,
  type ManualPaymentMethod,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

type Appt = {
  id: string;
  staffId: string;
  startAt: string;
  endAt: string;
  customerName: string;
  serviceName: string;
  staffName: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
};

type Stf = { id: string; displayName: string; active: boolean };

function mapAppt(raw: unknown): Appt {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    staffId: String(r.staffId ?? ""),
    startAt: String(r.startAt ?? ""),
    endAt: String(r.endAt ?? ""),
    customerName: String(r.customerName ?? ""),
    serviceName: String(r.serviceName ?? ""),
    staffName: String(r.staffName ?? ""),
    status: String(r.status ?? ""),
    paymentStatus: String(r.paymentStatus ?? ""),
    paymentMethod: r.paymentMethod != null ? String(r.paymentMethod) : null,
  };
}

export default function TenantBookingsPage() {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;
  const clinicId = profile?.clinic?.id ?? null;
  const [appts, setAppts] = useState<Appt[]>([]);
  const [staffList, setStaffList] = useState<Stf[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      const [ap, st] = await Promise.all([
        apiTenantAppointments(token, clinicId),
        apiTenantStaff(token, clinicId),
      ]);
      setAppts((ap as unknown[]).map(mapAppt));
      setStaffList(
        (st as { id: string; displayName: string; active: boolean }[]).filter((s) => s.active !== false),
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [token, clinicId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelOne(a: Appt) {
    if (!token || !clinicId) return;
    if (!window.confirm(`Cancel booking for ${a.customerName} on ${new Date(a.startAt).toLocaleString()}?`)) return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantCancelAppointment(token, clinicId, a.id);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reassignOne(a: Appt, newStaffId: string) {
    if (!token || !clinicId || newStaffId === a.staffId) return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantReassignAppointment(token, clinicId, a.id, newStaffId);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Reassign failed");
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(a: Appt, method: ManualPaymentMethod = "CASH") {
    if (!token || !clinicId) return;
    if (a.paymentStatus === "PAID") return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantMarkAppointmentPaid(token, clinicId, a.id, method);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Mark paid failed");
    } finally {
      setBusyId(null);
    }
  }

  const canAct = (status: string) => status !== "CANCELLED" && status !== "COMPLETED";

  if (loading && !profile) return <main className="section hub-page"><p className="text-muted">Loading…</p></main>;

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Bookings</h1>
      <p className="page-subtitle">
        Cancel or reassign visits. Collect cash / UPI at the desk and tap <strong>Mark paid</strong> — Razorpay is
        optional.
      </p>
      {err && <div className="alert alert--error">{err}</div>}
      {role === "STAFF" && (
        <p className="text-muted small">You can manage visits assigned to you (plus owners can manage all).</p>
      )}

      <ul className="booking-manager-list">
        {appts.map((a) => (
          <li key={a.id} className="surface-card booking-manager-card">
            <div>
              <strong>{new Date(a.startAt).toLocaleString()}</strong>
              <p className="text-muted small">
                {a.customerName} · {a.serviceName} · {a.staffName}
              </p>
              <p className="text-muted small">
                {a.status} · {a.paymentStatus}
                {a.paymentMethod ? ` (${a.paymentMethod})` : ""}
              </p>
            </div>
            <div className="booking-manager-actions">
              <div className="field field--compact">
                <label className="small text-muted" htmlFor={`re-${a.id}`}>
                  Assign to
                </label>
                <select
                  id={`re-${a.id}`}
                  className="select-input"
                  value={a.staffId}
                  disabled={!canAct(a.status) || busyId === a.id || staffList.length === 0}
                  onChange={(e) => void reassignOne(a, e.target.value)}
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="btn-row">
                {a.paymentStatus !== "PAID" && a.status !== "CANCELLED" && (
                  <>
                    <button
                      type="button"
                      className="btn btn--gold btn--small"
                      disabled={busyId === a.id}
                      onClick={() => void markPaid(a, "CASH")}
                    >
                      {busyId === a.id ? "…" : "Mark paid (cash)"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={busyId === a.id}
                      onClick={() => void markPaid(a, "UPI")}
                    >
                      UPI paid
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={!canAct(a.status) || busyId === a.id}
                  onClick={() => void cancelOne(a)}
                >
                  {busyId === a.id ? "…" : "Cancel booking"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
