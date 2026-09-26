import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiCreateStaff,
  apiIndiaGeo,
  apiMetaStaffProfileOptions,
  apiTenantAppointments,
  apiTenantCancelAppointment,
  apiTenantCompleteAppointment,
  apiTenantMarkAppointmentPaid,
  apiTenantNoShowAppointment,
  apiTenantReassignAppointment,
  apiTenantStaff,
  apiUpdateStaff,
  type IndiaGeoData,
} from "../../api/client";
import { PasswordField } from "../../components/PasswordField";
import { useAuth } from "../../context/AuthContext";

type Stf = {
  id: string;
  displayName: string;
  specialization: string | null;
  workingHoursJson: string | null;
  email: string | null;
  mobile: string | null;
  gender: string | null;
  parallelBookingsMax: number;
  photoUrl: string | null;
  active: boolean;
  hasLogin?: boolean;
};

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
  staffNotes: string | null;
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const POLL_MS = 28_000;

function defaultWeeklyJson(): string {
  const weekly: Record<string, string[]> = {};
  for (const d of DAYS) weekly[d] = d === "sun" ? [] : ["09:00-18:00"];
  return JSON.stringify({ weekly, note: "Edit hours per day; empty day = off." }, null, 0);
}

function todayLocalYmd(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDayBounds(dayStr: string): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayStr);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const start = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const end = new Date(y, mo - 1, d + 1, 0, 0, 0, 0);
  return { start, end };
}

function weekdayKey(d: Date): (typeof DAYS)[number] {
  return DAYS[(d.getDay() + 6) % 7];
}

function parseWeeklyRanges(json: string | null, dayKey: string): { startMin: number; endMin: number }[] {
  if (!json?.trim()) return [];
  try {
    const o = JSON.parse(json) as { weekly?: Record<string, unknown> };
    const arr = o.weekly?.[dayKey];
    if (!Array.isArray(arr)) return [];
    const out: { startMin: number; endMin: number }[] = [];
    for (const raw of arr) {
      const s = String(raw);
      const mm = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(s);
      if (!mm) continue;
      const sh = Number(mm[1]);
      const sm = Number(mm[2]);
      const eh = Number(mm[3]);
      const em = Number(mm[4]);
      out.push({ startMin: sh * 60 + sm, endMin: eh * 60 + em });
    }
    return out;
  } catch {
    return [];
  }
}

function minutesSinceMidnight(iso: string, dayStart: Date): number {
  const t = new Date(iso).getTime();
  return Math.round((t - dayStart.getTime()) / 60_000);
}

function formatMinuteSpan(dayStr: string, startMin: number, endMin: number): string {
  const b = parseLocalDayBounds(dayStr);
  if (!b) return "";
  const s = new Date(b.start);
  s.setMinutes(startMin);
  const e = new Date(b.start);
  e.setMinutes(endMin);
  const o: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${s.toLocaleTimeString(undefined, o)} – ${e.toLocaleTimeString(undefined, o)}`;
}

function mergeIntervals(iv: { a: number; b: number }[]): { a: number; b: number }[] {
  if (!iv.length) return [];
  const s = [...iv].sort((x, y) => x.a - y.a);
  const out: { a: number; b: number }[] = [];
  let cur = { ...s[0] };
  for (let i = 1; i < s.length; i++) {
    const n = s[i];
    if (n.a <= cur.b) cur.b = Math.max(cur.b, n.b);
    else {
      out.push(cur);
      cur = { ...n };
    }
  }
  out.push(cur);
  return out;
}

function subtractFromRanges(
  ranges: { startMin: number; endMin: number }[],
  busy: { a: number; b: number }[],
): { startMin: number; endMin: number }[] {
  const free: { startMin: number; endMin: number }[] = [];
  for (const w of ranges) {
    let cursor = w.startMin;
    const end = w.endMin;
    for (const bu of busy) {
      if (bu.b <= cursor || bu.a >= end) continue;
      if (bu.a > cursor) free.push({ startMin: cursor, endMin: Math.min(bu.a, end) });
      cursor = Math.max(cursor, bu.b);
      if (cursor >= end) break;
    }
    if (cursor < end) free.push({ startMin: cursor, endMin: end });
  }
  return free.filter((f) => f.endMin > f.startMin + 2);
}

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
    staffNotes: r.staffNotes != null ? String(r.staffNotes) : null,
  };
}

type DispItem =
  | { kind: "open"; startMin: number; endMin: number }
  | { kind: "booked"; appt: Appt };

function buildDayItemsForStaff(
  staffId: string,
  dayStr: string,
  appts: Appt[],
  workingHoursJson: string | null,
): DispItem[] {
  const bounds = parseLocalDayBounds(dayStr);
  if (!bounds) return [];
  const { start: dayStart } = bounds;
  const dayKey = weekdayKey(dayStart);
  const work = parseWeeklyRanges(workingHoursJson, dayKey);

  const dayAppts = appts.filter((a) => {
    if (a.staffId !== staffId) return false;
    const t0 = new Date(a.startAt).getTime();
    return t0 >= dayStart.getTime() && t0 < bounds.end.getTime();
  });

  const activeBooked = dayAppts.filter((a) => a.status !== "CANCELLED");
  const busyRaw = activeBooked.map((a) => ({
    a: minutesSinceMidnight(a.startAt, dayStart),
    b: minutesSinceMidnight(a.endAt, dayStart),
  }));
  const busy = mergeIntervals(busyRaw.map((x) => ({ a: Math.max(0, x.a), b: Math.min(24 * 60, x.b) })));

  const openSegs =
    work.length > 0
      ? subtractFromRanges(
          work.map((w) => ({
            startMin: Math.max(0, w.startMin),
            endMin: Math.min(24 * 60, w.endMin),
          })),
          busy,
        )
      : [];

  const items: DispItem[] = [];
  for (const o of openSegs) items.push({ kind: "open", startMin: o.startMin, endMin: o.endMin });
  for (const a of activeBooked) items.push({ kind: "booked", appt: a });

  items.sort((x, y) => {
    const sx = x.kind === "open" ? x.startMin : minutesSinceMidnight(x.appt.startAt, dayStart);
    const sy = y.kind === "open" ? y.startMin : minutesSinceMidnight(y.appt.startAt, dayStart);
    return sx - sy;
  });
  return items;
}

function statusLabel(s: string): string {
  switch (s) {
    case "CONFIRMED":
      return "Confirmed";
    case "REQUESTED":
      return "Requested";
    case "COMPLETED":
      return "Completed";
    case "NO_SHOW":
      return "No-show";
    case "CANCELLED":
      return "Cancelled";
    default:
      return s || "—";
  }
}

export default function TenantStaffPage() {
  const { token, profile, loading } = useAuth();
  const clinicId = profile?.clinic?.id ?? null;
  const role = profile?.user.role;
  const canManage = role === "TENANT_ADMIN" || role === "SUPER_ADMIN" || role === "CLINIC_ADMIN";
  const canFloor = canManage || role === "STAFF";

  const [staff, setStaff] = useState<Stf[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [scheduleDay, setScheduleDay] = useState(todayLocalYmd);
  const [scheduleLive, setScheduleLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [geo, setGeo] = useState<IndiaGeoData | null>(null);

  const [stName, setStName] = useState("New stylist");
  const [spec, setSpec] = useState("Hair & beard");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [gender, setGender] = useState("UNSPECIFIED");
  const [parallel, setParallel] = useState(1);
  const [workingHoursJson, setWorkingHoursJson] = useState(defaultWeeklyJson);
  const [loginPassword, setLoginPassword] = useState("");
  const [genderOptions, setGenderOptions] = useState<string[]>(["UNSPECIFIED", "FEMALE", "MALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSpec, setEditSpec] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editGender, setEditGender] = useState("UNSPECIFIED");
  const [editParallel, setEditParallel] = useState(1);
  const [editLoginPassword, setEditLoginPassword] = useState("");

  const [reassignAppt, setReassignAppt] = useState<Appt | null>(null);
  const [reassignStaffId, setReassignStaffId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      const st = (await apiTenantStaff(token, clinicId)) as Stf[];
      setStaff(
        st.map((s) => ({
          ...s,
          workingHoursJson: s.workingHoursJson ?? null,
          email: s.email ?? null,
          mobile: s.mobile ?? null,
          gender: s.gender ?? null,
          parallelBookingsMax: typeof s.parallelBookingsMax === "number" ? s.parallelBookingsMax : 1,
          photoUrl: s.photoUrl ?? null,
          hasLogin: Boolean((s as Stf).hasLogin),
        })),
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [token, clinicId]);

  const loadSchedule = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      const raw = await apiTenantAppointments(token, clinicId);
      setAppts((raw as unknown[]).map(mapAppt));
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Schedule load failed");
    }
  }, [token, clinicId]);

  const loadAll = useCallback(async () => {
    await Promise.all([load(), loadSchedule()]);
  }, [load, loadSchedule]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule, scheduleDay]);

  useEffect(() => {
    if (!scheduleLive || !token || !clinicId) return;
    const id = window.setInterval(() => void loadSchedule(), POLL_MS);
    return () => window.clearInterval(id);
  }, [scheduleLive, loadSchedule, token, clinicId]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && token && clinicId) void loadSchedule();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadSchedule, token, clinicId]);

  useEffect(() => {
    void apiIndiaGeo()
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  useEffect(() => {
    void apiMetaStaffProfileOptions()
      .then((m) => {
        if (m.genders.length) setGenderOptions(m.genders);
      })
      .catch(() => {});
  }, []);

  const activeStaff = useMemo(() => staff.filter((s) => s.active !== false), [staff]);

  const regionHint = useMemo(() => {
    if (!geo?.states?.length) return null;
    return `${geo.states.length} states in India catalog (for business address / discovery).`;
  }, [geo]);

  async function addStaffM(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId || !canManage) return;
    try {
      await apiCreateStaff(token, clinicId, {
        displayName: stName,
        specialization: spec || null,
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        gender: gender || null,
        parallelBookingsMax: Math.min(50, Math.max(1, parallel)),
        photoUrl: photoUrl.trim() || null,
        workingHoursJson: workingHoursJson.trim() || null,
        loginPassword: loginPassword.trim() || null,
        active: true,
      });
      setStName("New stylist");
      setSpec("Hair & beard");
      setEmail("");
      setMobile("");
      setPhotoUrl("");
      setLoginPassword("");
      setGender("UNSPECIFIED");
      setParallel(1);
      setWorkingHoursJson(defaultWeeklyJson());
      await loadAll();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  function startEdit(s: Stf) {
    setEditId(s.id);
    setEditName(s.displayName);
    setEditSpec(s.specialization ?? "");
    setEditEmail(s.email ?? "");
    setEditMobile(s.mobile ?? "");
    setEditPhoto(s.photoUrl ?? "");
    setEditHours(s.workingHoursJson ?? defaultWeeklyJson());
    setEditGender(s.gender ?? "UNSPECIFIED");
    setEditParallel(s.parallelBookingsMax ?? 1);
    setEditLoginPassword("");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId || !editId || !canManage) return;
    try {
      await apiUpdateStaff(token, clinicId, editId, {
        displayName: editName.trim(),
        specialization: editSpec.trim() || null,
        email: editEmail.trim() || null,
        mobile: editMobile.trim() || null,
        gender: editGender || null,
        parallelBookingsMax: Math.min(50, Math.max(1, editParallel)),
        photoUrl: editPhoto.trim() || null,
        workingHoursJson: editHours.trim() || null,
        ...(editLoginPassword.trim() ? { loginPassword: editLoginPassword.trim() } : {}),
      });
      setEditId(null);
      setEditLoginPassword("");
      await loadAll();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  function openReassign(a: Appt) {
    setReassignAppt(a);
    setReassignStaffId(a.staffId);
    setReassignReason("");
  }

  async function submitReassign(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId || !reassignAppt || !reassignStaffId) return;
    if (reassignStaffId === reassignAppt.staffId) {
      setReassignAppt(null);
      return;
    }
    setBusyId(reassignAppt.id);
    setErr(null);
    try {
      await apiTenantReassignAppointment(token, clinicId, reassignAppt.id, reassignStaffId, reassignReason);
      setReassignAppt(null);
      await loadSchedule();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Reassign failed");
    } finally {
      setBusyId(null);
    }
  }

  const canActStatus = (status: string) => status !== "CANCELLED" && status !== "COMPLETED" && status !== "NO_SHOW";

  async function cancelAppt(a: Appt) {
    if (!token || !clinicId) return;
    if (!window.confirm(`Cancel ${a.customerName} · ${new Date(a.startAt).toLocaleString()}?`)) return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantCancelAppointment(token, clinicId, a.id);
      await loadSchedule();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  async function completeAppt(a: Appt) {
    if (!token || !clinicId) return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantCompleteAppointment(token, clinicId, a.id);
      await loadSchedule();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function noShowAppt(a: Appt) {
    if (!token || !clinicId) return;
    if (!window.confirm(`Mark no-show for ${a.customerName}?`)) return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantNoShowAppointment(token, clinicId, a.id);
      await loadSchedule();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function markPaidAppt(a: Appt) {
    if (!token || !clinicId || a.paymentStatus === "PAID") return;
    setBusyId(a.id);
    setErr(null);
    try {
      await apiTenantMarkAppointmentPaid(token, clinicId, a.id, "CASH");
      await loadSchedule();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Mark paid failed");
    } finally {
      setBusyId(null);
    }
  }

  function shiftDay(delta: number) {
    const b = parseLocalDayBounds(scheduleDay);
    if (!b) return;
    const n = new Date(b.start);
    n.setDate(n.getDate() + delta);
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, "0");
    const d = String(n.getDate()).padStart(2, "0");
    setScheduleDay(`${y}-${m}-${d}`);
  }

  if (loading && !profile) return <main className="section hub-page"><p className="text-muted">Loading…</p></main>;

  const scheduleBounds = parseLocalDayBounds(scheduleDay);
  const scheduleDayKey = scheduleBounds ? weekdayKey(scheduleBounds.start) : "mon";

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Staff</h1>
      <p className="page-subtitle">
        Roster and <strong>floor schedule</strong> for your business — bookings load from{" "}
        <code>/clinics/{"{id}"}/appointments</code>. Open blocks use each stylist&apos;s weekly JSON (same format as
        below). The schedule refreshes automatically about every half minute; the backend also pushes{" "}
        <code>/topic/clinics/{"{id}"}/slots</code> when bookings change for live public pages.
      </p>
      {regionHint && <p className="text-muted small">{regionHint}</p>}
      {err && <div className="alert alert--error">{err}</div>}
      {!canManage && <p className="text-muted small">Only the business owner can add or edit roster details.</p>}

      {clinicId && canFloor && (
        <section className="surface-card glass-card staff-floor-card">
          <div className="staff-floor-head">
            <h2 className="section-heading">Floor schedule</h2>
            <div className="staff-floor-toolbar">
              <label className="staff-floor-toggle">
                <input type="checkbox" checked={scheduleLive} onChange={(e) => setScheduleLive(e.target.checked)} />
                Auto-refresh
              </label>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => void loadSchedule()}>
                Refresh now
              </button>
              {lastRefresh && (
                <span className="text-muted small">Updated {lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          <div className="staff-floor-date-row">
            <button type="button" className="btn btn--ghost btn--small" onClick={() => shiftDay(-1)}>
              Previous day
            </button>
            <input
              type="date"
              className="staff-floor-date-input"
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
              aria-label="Schedule date"
            />
            <button type="button" className="btn btn--ghost btn--small" onClick={() => shiftDay(1)}>
              Next day
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setScheduleDay(todayLocalYmd())}>
              Today
            </button>
          </div>
          <div className="staff-floor-columns">
            {activeStaff.map((s) => {
              const items = buildDayItemsForStaff(s.id, scheduleDay, appts, s.workingHoursJson);
              const hasWork =
                scheduleBounds != null &&
                parseWeeklyRanges(s.workingHoursJson, weekdayKey(scheduleBounds.start)).length > 0;
              return (
                <div key={s.id} className="staff-floor-col">
                  <div className="staff-floor-col__title">
                    <strong>{s.displayName}</strong>
                    <span className="text-muted small">
                      {s.parallelBookingsMax > 1 ? ` · up to ${s.parallelBookingsMax} parallel` : ""}
                    </span>
                  </div>
                  {!hasWork && (
                    <p className="text-muted small staff-floor-hint">
                      No working hours for this weekday in JSON — showing bookings only; add{" "}
                      <code>weekly.{scheduleDayKey}</code> for open slots.
                    </p>
                  )}
                  {items.length === 0 ? (
                    <p className="text-muted small">Nothing on this day.</p>
                  ) : (
                    <ul className="staff-floor-slots">
                      {items.map((it, idx) =>
                        it.kind === "open" ? (
                          <li key={`o-${s.id}-${idx}`} className="staff-slot staff-slot--open">
                            <span className="staff-slot__time">{formatMinuteSpan(scheduleDay, it.startMin, it.endMin)}</span>
                            <span className="staff-slot__label">Open</span>
                          </li>
                        ) : (
                          <li key={it.appt.id} className={`staff-slot staff-slot--booked staff-slot--${String(it.appt.status).toLowerCase()}`}>
                            <div className="staff-slot__row1">
                              <span className="staff-slot__time">
                                {new Date(it.appt.startAt).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                –{" "}
                                {new Date(it.appt.endAt).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="staff-slot__badge">{statusLabel(it.appt.status)}</span>
                            </div>
                            <div className="staff-slot__detail">
                              <strong>{it.appt.customerName}</strong> · {it.appt.serviceName}
                            </div>
                            <div className="text-muted small">Payment: {it.appt.paymentStatus}</div>
                            {it.appt.staffNotes ? (
                              <details className="staff-slot__notes">
                                <summary>Internal notes</summary>
                                <pre>{it.appt.staffNotes}</pre>
                              </details>
                            ) : null}
                            {canFloor && (
                              <div className="staff-slot__actions">
                                {it.appt.paymentStatus !== "PAID" && it.appt.status !== "CANCELLED" && (
                                  <button
                                    type="button"
                                    className="btn btn--gold btn--small"
                                    disabled={busyId === it.appt.id}
                                    onClick={() => void markPaidAppt(it.appt)}
                                  >
                                    Cash / UPI collected
                                  </button>
                                )}
                                {canActStatus(it.appt.status) && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn--ghost btn--small"
                                      disabled={busyId === it.appt.id}
                                      onClick={() => void completeAppt(it.appt)}
                                    >
                                      Completed
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn--ghost btn--small"
                                      disabled={busyId === it.appt.id}
                                      onClick={() => void noShowAppt(it.appt)}
                                    >
                                      No-show
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn--ghost btn--small"
                                      disabled={busyId === it.appt.id}
                                      onClick={() => openReassign(it.appt)}
                                    >
                                      Hand off…
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn--ghost btn--small"
                                      disabled={busyId === it.appt.id}
                                      onClick={() => void cancelAppt(it.appt)}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="dash-grid">
        {canManage && (
          <section className="surface-card glass-card">
            <h2 className="section-heading">Add team member</h2>
            <p className="text-muted small">
              Each email and mobile can belong to only one roster row. Set an email + login password to let stylists or
              doctors sign in at <Link to="/login">/login</Link>, then open{" "}
              <Link to="/staff/schedule">Staff schedule</Link> and{" "}
              <Link to="/staff/availability">Availability</Link>.
            </p>
            <form onSubmit={addStaffM} className="stack">
              <div className="field">
                <label htmlFor="stn">Display name</label>
                <input id="stn" value={stName} onChange={(e) => setStName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="spc">Specialization / title</label>
                <input id="spc" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Hair stylist, Dermatologist…" />
              </div>
              <div className="field">
                <label htmlFor="em">Email (login + reminders)</label>
                <input id="em" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <PasswordField
                id="lpw"
                label="Staff login password (optional)"
                value={loginPassword}
                onChange={setLoginPassword}
                autoComplete="new-password"
                minLength={8}
                placeholder="Min 8 characters"
                hint="Creates a STAFF account so they can sign in and manage their schedule. Use Show to verify."
              />
              <div className="field">
                <label htmlFor="mb">Mobile (10-digit, India)</label>
                <input id="mb" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" />
              </div>
              <div className="field">
                <label htmlFor="sg">Gender (roster label)</label>
                <select id="sg" value={gender} onChange={(e) => setGender(e.target.value)}>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="par">Parallel bookings max</label>
                <input
                  id="par"
                  type="number"
                  min={1}
                  max={50}
                  value={parallel}
                  onChange={(e) => setParallel(Number(e.target.value) || 1)}
                />
                <p className="hint">How many overlapping appointments this stylist can carry.</p>
              </div>
              <div className="field">
                <label htmlFor="ph">Profile photo URL</label>
                <input id="ph" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="field">
                <label htmlFor="wh">Weekly availability (JSON)</label>
                <textarea
                  id="wh"
                  rows={5}
                  value={workingHoursJson}
                  onChange={(e) => setWorkingHoursJson(e.target.value)}
                  className="input-textarea"
                />
                <p className="hint">Monthly updates: add a <code>monthly</code> key or notes in JSON; backend stores this as-is.</p>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => setWorkingHoursJson(defaultWeeklyJson())}
                >
                  Reset template
                </button>
              </div>
              <button type="submit" className="btn btn--gradient btn--wide" disabled={!canManage}>
                Add staff
              </button>
            </form>
          </section>
        )}
        <section className="surface-card">
          <h2 className="section-heading">Team ({staff.length})</h2>
          <ul className="data-list tenant-staff-list">
            {staff.map((s) => (
              <li key={s.id} className="tenant-staff-row">
                <div className="tenant-staff-row__main">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" className="tenant-staff-avatar" width={48} height={48} />
                  ) : (
                    <div className="tenant-staff-avatar tenant-staff-avatar--placeholder" aria-hidden>
                      {s.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong>{s.displayName}</strong>
                    {s.specialization ? ` · ${s.specialization}` : ""}
                    <div className="text-muted small">
                      {[s.email, s.mobile].filter(Boolean).join(" · ") || "No email / mobile"}
                      {s.gender ? ` · ${s.gender}` : ""}
                      {` · up to ${s.parallelBookingsMax} parallel`}
                      {s.hasLogin ? " · login ready" : " · no login yet"}
                      {!s.active ? " · inactive" : ""}
                    </div>
                  </div>
                </div>
                {canManage && (
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editId && canManage && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-staff-title">
          <div className="surface-card modal-card">
            <h2 id="edit-staff-title" className="section-heading">
              Edit staff
            </h2>
            <form onSubmit={saveEdit} className="stack">
              <div className="field">
                <label htmlFor="en">Display name</label>
                <input id="en" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="es">Specialization</label>
                <input id="es" value={editSpec} onChange={(e) => setEditSpec(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ee">Email</label>
                <input id="ee" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <PasswordField
                id="elp"
                label="Set / reset login password"
                value={editLoginPassword}
                onChange={setEditLoginPassword}
                autoComplete="new-password"
                placeholder="Leave blank to keep unchanged"
                hint="Use Show to verify. Leave blank to keep the current password."
              />
              <div className="field">
                <label htmlFor="em2">Mobile</label>
                <input id="em2" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eg">Gender</label>
                <select id="eg" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="epar">Parallel bookings max</label>
                <input
                  id="epar"
                  type="number"
                  min={1}
                  max={50}
                  value={editParallel}
                  onChange={(e) => setEditParallel(Number(e.target.value) || 1)}
                />
              </div>
              <div className="field">
                <label htmlFor="ep">Photo URL</label>
                <input id="ep" value={editPhoto} onChange={(e) => setEditPhoto(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eh">Weekly / monthly availability (JSON)</label>
                <textarea id="eh" rows={6} value={editHours} onChange={(e) => setEditHours(e.target.value)} className="input-textarea" />
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn--gradient">
                  Save
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reassignAppt && canFloor && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reassign-title">
          <div className="surface-card modal-card">
            <h2 id="reassign-title" className="section-heading">
              Hand off appointment
            </h2>
            <p className="text-muted small">
              {reassignAppt.customerName} · {new Date(reassignAppt.startAt).toLocaleString()} · {reassignAppt.serviceName}
            </p>
            <form onSubmit={submitReassign} className="stack">
              <div className="field">
                <label htmlFor="rs">Assign to</label>
                <select id="rs" value={reassignStaffId} onChange={(e) => setReassignStaffId(e.target.value)} required>
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rr">Reason (optional, saved in internal notes)</label>
                <textarea
                  id="rr"
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="input-textarea"
                  placeholder="e.g. Stylist called in sick — covered by senior stylist"
                  maxLength={500}
                />
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn--gradient" disabled={busyId === reassignAppt.id}>
                  {busyId === reassignAppt.id ? "Saving…" : "Save hand-off"}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setReassignAppt(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
