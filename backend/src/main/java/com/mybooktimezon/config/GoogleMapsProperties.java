package com.mybooktimezon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Google Maps platform key (Geocoding + optional Embed). Prefer env {@code GOOGLE_MAPS_API_KEY}.
 * When blank, geocode falls back to OpenStreetMap Nominatim (less precise than Google).
 */
@Data
@ConfigurationProperties(prefix = "app.google-maps")
public class GoogleMapsProperties {

    /** Server-side key with Geocoding API enabled. */
    private String apiKey = "";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
