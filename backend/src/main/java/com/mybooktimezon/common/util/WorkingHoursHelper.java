package com.mybooktimezon.common.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Parses staff/clinic {@code workingHoursJson} of the form:
 * {@code {"weekly":{"mon":["09:00-18:00"],"tue":[],...}}}
 */
public final class WorkingHoursHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final Map<DayOfWeek, String> DAY_KEYS =
            Map.of(
                    DayOfWeek.MONDAY, "mon",
                    DayOfWeek.TUESDAY, "tue",
                    DayOfWeek.WEDNESDAY, "wed",
                    DayOfWeek.THURSDAY, "thu",
                    DayOfWeek.FRIDAY, "fri",
                    DayOfWeek.SATURDAY, "sat",
                    DayOfWeek.SUNDAY, "sun");

    private WorkingHoursHelper() {}

    public record TimeRange(LocalTime start, LocalTime end) {
        public boolean containsInstant(LocalTime t) {
            return !t.isBefore(start) && t.isBefore(end);
        }

        public boolean coversWindow(LocalTime windowStart, LocalTime windowEnd) {
            return !windowStart.isBefore(start) && !windowEnd.isAfter(end);
        }
    }

    public static List<TimeRange> rangesForDate(String workingHoursJson, LocalDate date) {
        if (workingHoursJson == null || workingHoursJson.isBlank()) {
            return defaultWeekdayRanges(date.getDayOfWeek());
        }
        try {
            JsonNode root = MAPPER.readTree(workingHoursJson);
            JsonNode weekly = root.path("weekly");
            if (!weekly.isObject()) {
                return defaultWeekdayRanges(date.getDayOfWeek());
            }
            String key = DAY_KEYS.get(date.getDayOfWeek());
            JsonNode day = weekly.path(key);
            if (!day.isArray() || day.isEmpty()) {
                return List.of();
            }
            List<TimeRange> out = new ArrayList<>();
            for (JsonNode n : day) {
                String s = n.asText("");
                TimeRange r = parseRange(s);
                if (r != null) {
                    out.add(r);
                }
            }
            return out;
        } catch (Exception ex) {
            return defaultWeekdayRanges(date.getDayOfWeek());
        }
    }

    public static boolean isWithinWorkingHours(String workingHoursJson, LocalDate date, LocalTime start, LocalTime end) {
        List<TimeRange> ranges = rangesForDate(workingHoursJson, date);
        if (ranges.isEmpty()) {
            return false;
        }
        for (TimeRange r : ranges) {
            if (r.coversWindow(start, end)) {
                return true;
            }
        }
        return false;
    }

    /** Hourly candidate starts inside working ranges (inclusive start, exclusive end of range). */
    public static List<LocalTime> hourlyStarts(String workingHoursJson, LocalDate date) {
        List<TimeRange> ranges = rangesForDate(workingHoursJson, date);
        if (ranges.isEmpty()) {
            return List.of();
        }
        List<LocalTime> starts = new ArrayList<>();
        for (TimeRange r : ranges) {
            LocalTime t = r.start();
            while (t.isBefore(r.end())) {
                starts.add(t);
                t = t.plusHours(1);
            }
        }
        return starts;
    }

    private static List<TimeRange> defaultWeekdayRanges(DayOfWeek day) {
        if (day == DayOfWeek.SUNDAY) {
            return List.of();
        }
        return List.of(new TimeRange(LocalTime.of(9, 0), LocalTime.of(17, 0)));
    }

    private static TimeRange parseRange(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String[] parts = raw.trim().split("-");
        if (parts.length != 2) {
            return null;
        }
        try {
            LocalTime a = LocalTime.parse(parts[0].trim());
            LocalTime b = LocalTime.parse(parts[1].trim());
            if (!b.isAfter(a)) {
                return null;
            }
            return new TimeRange(a, b);
        } catch (Exception ex) {
            return null;
        }
    }

    public static String defaultWeeklyJson() {
        return """
                {"weekly":{"mon":["09:00-18:00"],"tue":["09:00-18:00"],"wed":["09:00-18:00"],"thu":["09:00-18:00"],"fri":["09:00-18:00"],"sat":["09:00-14:00"],"sun":[]},"note":"Edit in Staff or Settings"}
                """
                .trim();
    }
}
