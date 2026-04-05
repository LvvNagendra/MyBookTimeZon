package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
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

    @GetMapping
    public ResponseEntity<ResponseMessage<Map<String, String>>> health() {
        Map<String, String> payload = Map.of("service", "mybooktimezon-api", "status", "UP");
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "OK", payload));
    }
}
