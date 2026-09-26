/** Shared weekly working-hours JSON used by salon staff and clinic doctors. */

export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type WeeklyHours = Record<WeekdayKey, string[]>;

export function defaultWeeklyHours(): WeeklyHours {
  return {
    mon: ["09:00-18:00"],
    tue: ["09:00-18:00"],
    wed: ["09:00-18:00"],
    thu: ["09:00-18:00"],
    fri: ["09:00-18:00"],
    sat: ["09:00-14:00"],
    sun: [],
  };
}

export function defaultWeeklyJson(note = "Edit availability anytime"): string {
  return JSON.stringify({ weekly: defaultWeeklyHours(), note }, null, 2);
}

export function parseWeeklyHours(json: string | null | undefined): WeeklyHours {
  const base = defaultWeeklyHours();
  if (!json || !json.trim()) return base;
  try {
    const root = JSON.parse(json) as { weekly?: Record<string, string[]> };
    const w = root.weekly ?? {};
    for (const key of WEEKDAY_KEYS) {
      const ranges = w[key];
      base[key] = Array.isArray(ranges) ? ranges.map(String) : [];
    }
    return base;
  } catch {
    return base;
  }
}

export function serializeWeeklyHours(weekly: WeeklyHours, note?: string): string {
  return JSON.stringify({ weekly, note: note ?? "Working hours" }, null, 2);
}

export function dayRange(weekly: WeeklyHours, day: WeekdayKey): { open: boolean; start: string; end: string } {
  const ranges = weekly[day] ?? [];
  if (!ranges.length) return { open: false, start: "09:00", end: "18:00" };
  const first = ranges[0]!.split("-");
  return {
    open: true,
    start: first[0]?.trim() || "09:00",
    end: first[1]?.trim() || "18:00",
  };
}

export function setDayRange(
  weekly: WeeklyHours,
  day: WeekdayKey,
  open: boolean,
  start: string,
  end: string,
): WeeklyHours {
  return {
    ...weekly,
    [day]: open ? [`${start}-${end}`] : [],
  };
}
