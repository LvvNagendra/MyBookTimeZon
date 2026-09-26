package com.mybooktimezon.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.config.GoogleMapsProperties;
import com.mybooktimezon.service.GeocodeService;
import com.mybooktimezon.web.dto.response.GeocodeResultDto;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeocodeServiceImpl implements GeocodeService {

    private final GoogleMapsProperties googleMapsProperties;

    @Override
    public GeocodeResultDto resolve(String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Address query is required");
        }
        if (googleMapsProperties.isConfigured()) {
            try {
                return resolveGoogle(q);
            } catch (BusinessException ex) {
                throw ex;
            } catch (Exception ex) {
                log.warn("Google geocode failed for '{}': {}", q, ex.getMessage());
                throw new BusinessException(
                        HttpStatus.BAD_GATEWAY, "Google Geocoding failed — check API key and Geocoding API enablement", ex);
            }
        }
        try {
            return resolveNominatim(q);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Nominatim geocode failed for '{}': {}", q, ex.getMessage());
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Could not resolve map location", ex);
        }
    }

    private GeocodeResultDto resolveGoogle(String query) {
        String url =
                "https://maps.googleapis.com/maps/api/geocode/json?address="
                        + URLEncoder.encode(query, StandardCharsets.UTF_8)
                        + "&key="
                        + URLEncoder.encode(googleMapsProperties.getApiKey(), StandardCharsets.UTF_8);
        JsonNode root =
                RestClient.create()
                        .get()
                        .uri(url)
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve()
                        .body(JsonNode.class);
        if (root == null) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Empty Google Geocoding response");
        }
        String status = root.path("status").asText("");
        if ("ZERO_RESULTS".equals(status)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "No Google map match for that address");
        }
        if (!"OK".equals(status)) {
            String err = root.path("error_message").asText(status);
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Google Geocoding: " + err);
        }
        JsonNode first = root.path("results").path(0);
        JsonNode loc = first.path("geometry").path("location");
        double lat = loc.path("lat").asDouble(Double.NaN);
        double lng = loc.path("lng").asDouble(Double.NaN);
        if (!Double.isFinite(lat) || !Double.isFinite(lng)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Google Geocoding returned invalid coordinates");
        }
        return GeocodeResultDto.builder()
                .latitude(lat)
                .longitude(lng)
                .formattedAddress(first.path("formatted_address").asText(query))
                .provider("GOOGLE")
                .build();
    }

    /** Fallback when no Google key — OSM Nominatim (usage policy: identify app). */
    private GeocodeResultDto resolveNominatim(String query) {
        String url =
                "https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
                        + URLEncoder.encode(query, StandardCharsets.UTF_8);
        JsonNode[] arr =
                RestClient.create()
                        .get()
                        .uri(url)
                        .accept(MediaType.APPLICATION_JSON)
                        .header("User-Agent", "SlotNexa/1.0 (tenant-map-pin; contact=support@slotnexa.app)")
                        .retrieve()
                        .body(JsonNode[].class);
        if (arr == null || arr.length == 0) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "No map match — set GOOGLE_MAPS_API_KEY for Google-accurate pins, or refine the address");
        }
        JsonNode first = arr[0];
        double lat = Double.parseDouble(first.path("lat").asText("NaN"));
        double lng = Double.parseDouble(first.path("lon").asText("NaN"));
        if (!Double.isFinite(lat) || !Double.isFinite(lng)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Geocoder returned invalid coordinates");
        }
        return GeocodeResultDto.builder()
                .latitude(lat)
                .longitude(lng)
                .formattedAddress(first.path("display_name").asText(query))
                .provider("NOMINATIM")
                .build();
    }
}
