package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.ClinicService;
import com.mybooktimezon.web.dto.request.ClinicUpdateRequest;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/clinics")
@Tag(name = "Clinics", description = "Tenant (business) profile. JWT required except public slug lookup.")
@RequiredArgsConstructor
public class ClinicController {

    private final ClinicService clinicService;

    @GetMapping("/me")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ResponseEntity<ResponseMessage<ClinicResponseDto>> myClinic(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        ClinicResponseDto data = clinicService.getMyClinic(principal);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Clinic loaded", data));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ResponseMessage<ClinicResponseDto>> bySlug(@PathVariable String slug) {
        ClinicResponseDto data = clinicService.getBySlug(slug);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Clinic loaded", data));
    }

    @GetMapping("/{clinicId}")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ResponseEntity<ResponseMessage<ClinicResponseDto>> byId(
            @PathVariable UUID clinicId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        ClinicResponseDto data = clinicService.getByIdForUser(clinicId, principal);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Clinic loaded", data));
    }

    @PutMapping("/{clinicId}")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ResponseEntity<ResponseMessage<ClinicResponseDto>> update(
            @PathVariable UUID clinicId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody ClinicUpdateRequest request) {
        ClinicResponseDto data = clinicService.updateForUser(clinicId, principal, request);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Clinic updated", data));
    }
}
