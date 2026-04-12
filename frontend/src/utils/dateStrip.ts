/** Next N calendar days for horizontal date picker (local date). */

export type DayStripItem = {
  iso: string;
  weekdayShort: string;
  dayNum: string;
  monthShort: string;
};

export function buildDayStrip(count = 7, from = new Date()): DayStripItem[] {
  const out: DayStripItem[] = [];
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const cur = new Date(d);
    cur.setDate(d.getDate() + i);
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    out.push({
      iso,
      weekdayShort: cur.toLocaleDateString(undefined, { weekday: "short" }),
      dayNum: String(cur.getDate()),
      monthShort: cur.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  return out;
}
