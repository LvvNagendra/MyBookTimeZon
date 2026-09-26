import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiTenantStaff, apiUpdateStaff } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
  dayRange,
  parseWeeklyHours,
  serializeWeeklyHours,
  setDayRange,
  type WeekdayKey,
  type WeeklyHours,
} from "../../utils/workingHours";

type StaffRow = {
  id: string;
  displayName: string;
  email?: string | null;
  workingHoursJson?: string | null;
  linkedUserId?: string | null;
  hasLogin?: boolean;
};

export default function StaffAvailabilityPage() {
  const { token, profile } = useAuth();
  const clinicId = profile?.clinic?.id ?? null;
  const [staff, setStaff] = useState<StaffRow | null>(null);
  const [weekly, setWeekly] = useState<WeeklyHours>(() => parseWeeklyHours(null));
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      const rows = (await apiTenantStaff(token, clinicId)) as StaffRow[];
      const meId = profile?.user.id;
      const mine =
        rows.find((s) => s.linkedUserId && String(s.linkedUserId) === meId) ||
        rows.find((s) => s.email && s.email.toLowerCase() === profile?.user.email.toLowerCase()) ||
        (profile?.user.role === "TENANT_ADMIN" ? rows[0] : null);
      if (!mine) {
        setErr("No staff roster linked to your login. Ask the owner to add your email and login password under Staff.");
        setStaff(null);
        return;
      }
      setStaff(mine);
      setWeekly(parseWeeklyHours(mine.workingHoursJson));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load availability");
    }
  }, [token, clinicId, profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = useMemo(
    () => (profile?.clinic?.businessType === "CLINIC" ? "Doctor availability" : "My availability"),
    [profile?.clinic?.businessType],
  );

  function patchDay(day: WeekdayKey, patch: Partial<{ open: boolean; start: string; end: string }>) {
    const cur = dayRange(weekly, day);
    const next = setDayRange(
      weekly,
      day,
      patch.open ?? cur.open,
      patch.start ?? cur.start,
      patch.end ?? cur.end,
    );
    setWeekly(next);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId || !staff) return;
    setBusy(true);
    setErr(null);
    try {
      await apiUpdateStaff(token, clinicId, staff.id, {
        displayName: staff.displayName,
        workingHoursJson: serializeWeeklyHours(weekly),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      await load();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/staff/schedule">Schedule</Link>
      </p>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">
        These hours drive live booking slots for customers. Closed days show no open times.
      </p>

      {err ? <p className="form-error">{err}</p> : null}

      {!staff ? (
        <div className="surface-card glass-card">
          <p className="text-muted" style={{ margin: 0 }}>
            Link your roster account from the owner dashboard (Staff → email + login password), then refresh.
          </p>
        </div>
      ) : (
        <form className="surface-card glass-card" onSubmit={onSave}>
          <p>
            Editing hours for <strong>{staff.displayName}</strong>
          </p>
          <div className="avail-grid">
            {WEEKDAY_KEYS.map((day) => {
              const r = dayRange(weekly, day);
              return (
                <label key={day} className="avail-row">
                  <span className="avail-day">{WEEKDAY_LABELS[day]}</span>
                  <input
                    type="time"
                    className="avail-time"
                    value={r.start}
                    disabled={!r.open}
                    onChange={(e) => patchDay(day, { start: e.target.value })}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    className="avail-time"
                    value={r.end}
                    disabled={!r.open}
                    onChange={(e) => patchDay(day, { end: e.target.value })}
                  />
                  <input
                    type="checkbox"
                    checked={r.open}
                    onChange={(e) => patchDay(day, { open: e.target.checked })}
                    aria-label={`${WEEKDAY_LABELS[day]} open`}
                  />
                </label>
              );
            })}
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy} style={{ marginTop: "1rem" }}>
            {busy ? "Saving…" : "Save availability"}
          </button>
          {saved ? (
            <p className="alert alert--success" role="status" style={{ marginTop: "1rem" }}>
              Saved — booking slots updated.
            </p>
          ) : null}
        </form>
      )}
    </main>
  );
}
