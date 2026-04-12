package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/health")
@Tag(name = "Health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    /** Process is up (no dependency checks). */
    @GetMapping
    public ResponseEntity<ResponseMessage<Map<String, String>>> health() {
        Map<String, String> payload = Map.of("service", "mybooktimezon-api", "status", "UP");
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "OK", payload));
    }

    /** For load balancers / k8s: verifies JDBC connectivity. */
    @GetMapping("/ready")
    public ResponseEntity<ResponseMessage<Map<String, Object>>> ready() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("service", "mybooktimezon-api");
        try (Connection c = dataSource.getConnection()) {
            if (!c.isValid(3)) {
                payload.put("database", "DOWN");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ResponseMessageFactory.success(HttpStatus.SERVICE_UNAVAILABLE, "Not ready", payload));
            }
            payload.put("database", "UP");
            return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Ready", payload));
        } catch (Exception ex) {
            payload.put("database", "DOWN");
            payload.put("error", ex.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ResponseMessageFactory.success(HttpStatus.SERVICE_UNAVAILABLE, "Not ready", payload));
        }
    }
}
