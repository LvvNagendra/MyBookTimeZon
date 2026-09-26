import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiTenantAppointments, apiTenantStaff } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

type Appt = {
  id: string;
  startAt: string;
  endAt?: string;
  customerName?: string;
  serviceName?: string;
  status?: string;
  staffId?: string;
  staffName?: string;
};

type StaffRow = { id: string; email?: string | null; linkedUserId?: string | null; displayName: string };

export default function StaffSchedulePage() {
  const { token, profile } = useAuth();
  const clinicId = profile?.clinic?.id ?? null;
  const [appts, setAppts] = useState<Appt[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setLoading(true);
    setErr(null);
    try {
      const [rows, staff] = await Promise.all([
        apiTenantAppointments(token, clinicId) as Promise<Appt[]>,
        apiTenantStaff(token, clinicId) as Promise<StaffRow[]>,
      ]);
      const meId = profile?.user.id;
      const mine =
        staff.find((s) => s.linkedUserId && String(s.linkedUserId) === meId) ||
        staff.find((s) => s.email && s.email.toLowerCase() === profile?.user.email.toLowerCase());
      setStaffId(mine?.id ?? null);
      setAppts(rows);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load schedule");
    } finally {
      setLoading(false);
    }
  }, [token, clinicId, profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const mine = useMemo(() => {
    const now = Date.now();
    return appts
      .filter((a) => {
        if (staffId && a.staffId && String(a.staffId) !== staffId) return false;
        if (a.status === "CANCELLED") return false;
        return new Date(a.startAt).getTime() >= now - 2 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appts, staffId]);

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/staff/availability">Availability</Link>
      </p>
      <h1 className="page-title">My schedule</h1>
      <p className="page-subtitle">Upcoming appointments assigned to you.</p>

      {err ? <p className="form-error">{err}</p> : null}
      {loading ? <p className="text-muted">Loading…</p> : null}

      {!loading && mine.length === 0 ? (
        <div className="surface-card glass-card">
          <p className="text-muted" style={{ margin: 0 }}>
            No upcoming appointments. Keep your availability up to date so customers can book you.
          </p>
        </div>
      ) : (
        <ul className="schedule-list">
          {mine.map((a) => (
            <li key={a.id} className="surface-card schedule-card glass-card">
              <div>
                <strong>
                  {new Date(a.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </strong>
                <p className="text-muted small">
                  {a.customerName || "Guest"} · {a.serviceName || "Service"}
                </p>
              </div>
              <span className="badge badge--lav">{a.status || "CONFIRMED"}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
