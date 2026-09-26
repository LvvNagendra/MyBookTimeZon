import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  apiCustomerAppointments,
  apiCustomerCancelAppointment,
  apiCustomerRescheduleAppointment,
} from "../api/client";
import { PageBackBar } from "../components/PageBackBar";
import { useAuth } from "../context/AuthContext";

type Row = {
  id: string;
  startAt: string;
  endAt: string;
  serviceName: string;
  staffName: string;
  status: string;
  paymentStatus: string;
  clinicId?: string;
};

function mapAppointment(raw: unknown): Row {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    startAt: String(r.startAt ?? ""),
    endAt: String(r.endAt ?? ""),
    serviceName: String(r.serviceName ?? ""),
    staffName: String(r.staffName ?? ""),
    status: String(r.status ?? ""),
    paymentStatus: String(r.paymentStatus ?? ""),
    clinicId: r.clinicId != null ? String(r.clinicId) : undefined,
  };
}

function canMutate(r: Row): boolean {
  if (r.status === "CANCELLED" || r.status === "COMPLETED" || r.status === "NO_SHOW") return false;
  const t = new Date(r.startAt).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function statusClass(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "BOOKED":
      return "badge badge--lav";
    case "CANCELLED":
      return "badge";
    case "COMPLETED":
      return "badge";
    default:
      return "badge";
  }
}

export default function CustomerBookingsPage() {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newLocal, setNewLocal] = useState("");

  async function reload() {
    if (!token) return;
    setListLoading(true);
    try {
      const list = await apiCustomerAppointments(token);
      const rowsRaw = Array.isArray(list) ? list : [];
      setRows(rowsRaw.map(mapAppointment));
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    // Wait for auth profile so we don't skip the fetch while role is still undefined.
    if (!token || loading) return;
    if (role && role !== "CUSTOMER") return;
    void reload().catch((e: unknown) => setErr(e instanceof Error ? e.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role, loading]);

  async function cancelRow(r: Row) {
    if (!token) return;
    if (!window.confirm(`Cancel this appointment on ${new Date(r.startAt).toLocaleString()}?`)) return;
    setBusyId(r.id);
    setErr(null);
    try {
      await apiCustomerCancelAppointment(token, r.id);
      await reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  async function submitReschedule(r: Row) {
    if (!token || !newLocal) return;
    const iso = new Date(newLocal).toISOString();
    if (Number.isNaN(Date.parse(iso))) {
      setErr("Pick a valid date and time");
      return;
    }
    setBusyId(r.id);
    setErr(null);
    try {
      await apiCustomerRescheduleAppointment(token, r.id, iso);
      setRescheduleId(null);
      setNewLocal("");
      await reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Reschedule failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!token) return <Navigate to="/login" replace state={{ from: "bookings" }} />;
  if (!loading && role && role !== "CUSTOMER") return <Navigate to="/" replace />;

  return (
    <main id="main" className="section page-pad">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">My bookings</h1>
        <p className="page-subtitle">
          Cancel or reschedule upcoming visits. Status: BOOKED / CONFIRMED · CANCELLED · COMPLETED.
        </p>
        {err && <div className="alert alert--error">{err}</div>}
        {(loading || listLoading) && rows.length === 0 && !err && (
          <p className="text-muted">Loading your appointments…</p>
        )}
        {!loading && !listLoading && rows.length === 0 && !err && (
          <div className="surface-card empty-bookings">
            <p>No appointments yet.</p>
            <Link to="/nearby" className="btn btn--gold btn--small">
              Find salon or clinic
            </Link>
          </div>
        )}
        <ul className="data-list booking-customer-list">
          {rows.map((r) => (
            <li key={r.id} className="surface-card booking-customer-card">
              <strong>{new Date(r.startAt).toLocaleString()}</strong>
              <div className="text-muted small" style={{ marginTop: 4 }}>
                {r.serviceName} · {r.staffName}
              </div>
              <div style={{ marginTop: 6 }}>
                <span className={statusClass(r.status)}>{r.status}</span>{" "}
                <span className="text-muted small">{r.paymentStatus}</span>
              </div>
              <div className="btn-row" style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={!canMutate(r) || busyId === r.id}
                  onClick={() => void cancelRow(r)}
                >
                  {busyId === r.id ? "…" : "Cancel"}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={!canMutate(r) || busyId === r.id}
                  onClick={() => {
                    setRescheduleId(r.id);
                    const d = new Date(r.startAt);
                    const pad = (n: number) => String(n).padStart(2, "0");
                    setNewLocal(
                      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
                    );
                  }}
                >
                  Reschedule
                </button>
              </div>
              {rescheduleId === r.id ? (
                <div className="stack" style={{ marginTop: "0.75rem" }}>
                  <label className="field">
                    New date &amp; time
                    <input
                      type="datetime-local"
                      value={newLocal}
                      onChange={(e) => setNewLocal(e.target.value)}
                    />
                  </label>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn btn--gold btn--small"
                      disabled={busyId === r.id}
                      onClick={() => void submitReschedule(r)}
                    >
                      Save new time
                    </button>
                    <button type="button" className="btn btn--ghost btn--small" onClick={() => setRescheduleId(null)}>
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
