import { useCallback } from "react";
import { Link } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildDemoIcs(): string {
  const stamp = "20260409T120000Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SalonGo//Demo Availability//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:salongo-demo-avail@salongo.app",
    `DTSTAMP:${stamp}`,
    "DTSTART:20260409T100000",
    "DTEND:20260409T200000",
    "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU",
    "SUMMARY:SalonGo demo working hours",
    "DESCRIPTION:Export from SalonGo staff availability (demo). Replace with API sync.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function StaffAvailabilityPage() {
  const downloadIcs = useCallback(() => {
    const blob = new Blob([buildDemoIcs()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salongo-availability-demo.ics";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/staff/schedule">Schedule</Link>
      </p>
      <h1 className="page-title">Availability</h1>
      <p className="page-subtitle">Set working hours — syncs to slot engine later.</p>

      <div className="surface-card glass-card">
        <div className="avail-toolbar">
          <p className="text-muted small" style={{ margin: 0 }}>
            Download a demo calendar file for testing (no server).
          </p>
          <button type="button" className="btn btn--gold" onClick={downloadIcs}>
            Download .ics
          </button>
        </div>
        <div className="avail-grid">
          {DAYS.map((d) => (
            <label key={d} className="avail-row">
              <span className="avail-day">{d}</span>
              <input type="time" defaultValue="10:00" disabled className="avail-time" />
              <span>–</span>
              <input type="time" defaultValue="20:00" disabled className="avail-time" />
              <input type="checkbox" defaultChecked disabled />
            </label>
          ))}
        </div>
        <p className="text-muted small">Demo controls disabled — wire to API for production.</p>
      </div>
    </main>
  );
}
