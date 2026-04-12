import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiCustomerAppointments, apiCustomerCancelAppointment } from "../api/client";
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
  };
}

function canCustomerCancel(r: Row): boolean {
  if (r.status === "CANCELLED" || r.status === "COMPLETED") return false;
  const t = new Date(r.startAt).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export default function CustomerBookingsPage() {
  const { token, profile, loading } = useAuth();
  const role = profile?.user.role;
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || role !== "CUSTOMER") return;
    void apiCustomerAppointments(token)
      .then((list) => setRows((list as unknown[]).map(mapAppointment)))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [token, role]);

  async function cancelRow(r: Row) {
    if (!token) return;
    if (!window.confirm(`Cancel this appointment on ${new Date(r.startAt).toLocaleString()}?`)) return;
    setBusyId(r.id);
    setErr(null);
    try {
      await apiCustomerCancelAppointment(token, r.id);
      const list = await apiCustomerAppointments(token);
      setRows((list as unknown[]).map(mapAppointment));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
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
        <p className="page-subtitle">Cancel visits before they start; SMS reminders when your mobile is on file.</p>
        {err && <div className="alert alert--error">{err}</div>}
        {rows.length === 0 && !err && (
          <div className="surface-card empty-bookings">
            <p>No appointments yet.</p>
            <Link to="/nearby" className="btn btn--gradient btn--small">
              Find salons
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
              <div className="text-muted small">
                {r.status} · {r.paymentStatus}
              </div>
              <div className="btn-row" style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  disabled={!canCustomerCancel(r) || busyId === r.id}
                  onClick={() => void cancelRow(r)}
                >
                  {busyId === r.id ? "…" : "Cancel appointment"}
                </button>
                <button type="button" className="btn btn--ghost btn--small" disabled>
                  Reschedule
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
