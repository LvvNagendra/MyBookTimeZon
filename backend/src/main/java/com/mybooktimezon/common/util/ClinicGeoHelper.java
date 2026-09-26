package com.mybooktimezon.common.util;

import com.mybooktimezon.domain.entity.Clinic;

/** Resolves a human-readable location line for APIs and UI. */
public final class ClinicGeoHelper {

    private ClinicGeoHelper() {}

    public static String resolveDisplayLocation(Clinic c) {
        if (c.getDisplayLocation() != null && !c.getDisplayLocation().isBlank()) {
            return c.getDisplayLocation().trim();
        }
        String v = c.getVillage() != null ? c.getVillage().trim() : "";
        String city = c.getCity() != null ? c.getCity().trim() : "";
        if (!v.isEmpty() && !city.isEmpty()) {
            return v + ", " + city;
        }
        if (!city.isEmpty()) {
            return city;
        }
        return v.isEmpty() ? null : v;
    }
}
