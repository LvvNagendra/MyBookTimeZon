package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AuthService;
import com.mybooktimezon.service.CustomerAppointmentService;
import com.mybooktimezon.web.dto.request.CustomerProfilePatchRequest;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import com.mybooktimezon.web.dto.response.UserResponseDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/me")
@Tag(name = "Customer", description = "End-customer bookings.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@RequiredArgsConstructor
public class CustomerMeController {

    private final CustomerAppointmentService customerAppointmentService;
    private final AuthService authService;

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ResponseMessage<List<AppointmentResponseDto>>> myAppointments(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<AppointmentResponseDto> data = customerAppointmentService.myAppointments(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Your appointments", data));
    }

    @PostMapping("/appointments/{appointmentId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ResponseMessage<AppointmentResponseDto>> cancelMyAppointment(
            @PathVariable UUID appointmentId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        AppointmentResponseDto data = customerAppointmentService.cancelMyAppointment(appointmentId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Appointment cancelled", data));
    }

    @PatchMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ResponseMessage<UserResponseDto>> updateCustomerProfile(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody CustomerProfilePatchRequest request) {
        UserResponseDto data = authService.updateCustomerProfile(principal, request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Profile updated", data));
    }
}
