package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AuthService;
import com.mybooktimezon.web.dto.request.LoginRequest;
import com.mybooktimezon.web.dto.request.RegisterClinicRequest;
import com.mybooktimezon.web.dto.request.RegisterCustomerRequest;
import com.mybooktimezon.web.dto.response.AuthResponse;
import com.mybooktimezon.web.dto.response.ProfileResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/auth")
@Tag(
        name = "Authentication",
        description = "Register business (tenant) or customer, login; JWT returned in response body.")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ResponseMessage<AuthResponse>> register(
            @Valid @RequestBody RegisterClinicRequest request) {
        AuthResponse data = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Registration successful", data));
    }

    @PostMapping("/register-customer")
    public ResponseEntity<ResponseMessage<AuthResponse>> registerCustomer(
            @Valid @RequestBody RegisterCustomerRequest request) {
        AuthResponse data = authService.registerCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Customer account created", data));
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseMessage<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Login successful", data));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ResponseEntity<ResponseMessage<ProfileResponse>> me(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        ProfileResponse data = authService.getProfile(principal);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Profile loaded", data));
    }
}
