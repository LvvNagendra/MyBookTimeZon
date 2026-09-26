package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.service.GeocodeService;
import com.mybooktimezon.web.dto.request.GeocodeResolveRequest;
import com.mybooktimezon.web.dto.response.GeocodeResultDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated geocode for Super Admin / Tenant Admin map pins (not public to limit abuse).
 */
@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/geo")
@Tag(name = "Geo", description = "Resolve address text to map coordinates.")
@RequiredArgsConstructor
public class GeoController {

    private final GeocodeService geocodeService;

    @PostMapping("/resolve")
    public ResponseEntity<ResponseMessage<GeocodeResultDto>> resolve(@Valid @RequestBody GeocodeResolveRequest request) {
        GeocodeResultDto data = geocodeService.resolve(request.getQuery());
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Geocoded", data));
    }
}
