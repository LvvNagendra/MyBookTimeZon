package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AppointmentService;
import com.mybooktimezon.service.ServiceOfferingService;
import com.mybooktimezon.service.StaffMemberService;
import com.mybooktimezon.service.TrendingStyleService;
import com.mybooktimezon.web.dto.request.AppointmentReassignRequest;
import com.mybooktimezon.web.dto.request.ServiceOfferingWriteRequest;
import com.mybooktimezon.web.dto.request.StaffMemberWriteRequest;
import com.mybooktimezon.web.dto.request.TrendingStyleWriteRequest;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import com.mybooktimezon.web.dto.response.ServiceOfferingResponseDto;
import com.mybooktimezon.web.dto.response.StaffMemberResponseDto;
import com.mybooktimezon.web.dto.response.TrendingStyleResponseDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/clinics/{clinicId}")
@Tag(name = "Tenant operations", description = "Services, staff, appointments for a tenant (clinic).")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@RequiredArgsConstructor
public class TenantOperationsController {

    private final ServiceOfferingService serviceOfferingService;
    private final StaffMemberService staffMemberService;
    private final AppointmentService appointmentService;
    private final TrendingStyleService trendingStyleService;

    @GetMapping("/services")
    public ResponseEntity<ResponseMessage<List<ServiceOfferingResponseDto>>> listServices(
            @PathVariable UUID clinicId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<ServiceOfferingResponseDto> data = serviceOfferingService.list(clinicId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Services", data));
    }

    /** Category labels already used on this tenant’s services — for dropdowns / datalist (no cross-tenant data). */
    @GetMapping("/service-categories")
    public ResponseEntity<ResponseMessage<List<String>>> listServiceCategories(
            @PathVariable UUID clinicId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<String> data = serviceOfferingService.listDistinctCategories(clinicId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Service categories", data));
    }

    @PostMapping("/services")
    public ResponseEntity<ResponseMessage<ServiceOfferingResponseDto>> createService(
            @PathVariable UUID clinicId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody ServiceOfferingWriteRequest request) {
        ServiceOfferingResponseDto data = serviceOfferingService.create(clinicId, principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Service created", data));
    }

    @PutMapping("/services/{serviceId}")
    public ResponseEntity<ResponseMessage<ServiceOfferingResponseDto>> updateService(
            @PathVariable UUID clinicId,
            @PathVariable UUID serviceId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody ServiceOfferingWriteRequest request) {
        ServiceOfferingResponseDto data = serviceOfferingService.update(clinicId, serviceId, principal, request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Service updated", data));
    }

    @GetMapping("/staff")
    public ResponseEntity<ResponseMessage<List<StaffMemberResponseDto>>> listStaff(
            @PathVariable UUID clinicId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<StaffMemberResponseDto> data = staffMemberService.list(clinicId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Staff", data));
    }

    @PostMapping("/staff")
    public ResponseEntity<ResponseMessage<StaffMemberResponseDto>> createStaff(
            @PathVariable UUID clinicId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody StaffMemberWriteRequest request) {
        StaffMemberResponseDto data = staffMemberService.create(clinicId, principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Staff created", data));
    }

    @PutMapping("/staff/{staffId}")
    public ResponseEntity<ResponseMessage<StaffMemberResponseDto>> updateStaff(
            @PathVariable UUID clinicId,
            @PathVariable UUID staffId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody StaffMemberWriteRequest request) {
        StaffMemberResponseDto data = staffMemberService.update(clinicId, staffId, principal, request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Staff updated", data));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ResponseMessage<List<AppointmentResponseDto>>> listAppointments(
            @PathVariable UUID clinicId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<AppointmentResponseDto> data = appointmentService.listForTenant(clinicId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Appointments", data));
    }

    @PostMapping("/appointments/{appointmentId}/cancel")
    public ResponseEntity<ResponseMessage<AppointmentResponseDto>> cancelAppointment(
            @PathVariable UUID clinicId,
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        AppointmentResponseDto data = appointmentService.cancelForTenant(clinicId, appointmentId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Appointment cancelled", data));
    }

    @PostMapping("/appointments/{appointmentId}/reassign")
    public ResponseEntity<ResponseMessage<AppointmentResponseDto>> reassignAppointment(
            @PathVariable UUID clinicId,
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody AppointmentReassignRequest request) {
        AppointmentResponseDto data =
                appointmentService.reassignStaff(
                        clinicId, appointmentId, request.getStaffId(), request.getReason(), principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Appointment reassigned", data));
    }

    @PostMapping("/appointments/{appointmentId}/complete")
    public ResponseEntity<ResponseMessage<AppointmentResponseDto>> completeAppointment(
            @PathVariable UUID clinicId,
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        AppointmentResponseDto data = appointmentService.completeForTenant(clinicId, appointmentId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Appointment completed", data));
    }

    @PostMapping("/appointments/{appointmentId}/no-show")
    public ResponseEntity<ResponseMessage<AppointmentResponseDto>> markNoShow(
            @PathVariable UUID clinicId,
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        AppointmentResponseDto data = appointmentService.markNoShowForTenant(clinicId, appointmentId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Appointment marked no-show", data));
    }

    @GetMapping("/trending-styles")
    public ResponseEntity<ResponseMessage<List<TrendingStyleResponseDto>>> listTrendingStyles(
            @PathVariable UUID clinicId, @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<TrendingStyleResponseDto> data = trendingStyleService.listForTenant(clinicId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Trending styles", data));
    }

    @PostMapping("/trending-styles")
    public ResponseEntity<ResponseMessage<TrendingStyleResponseDto>> createTrendingStyle(
            @PathVariable UUID clinicId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody TrendingStyleWriteRequest request) {
        TrendingStyleResponseDto data = trendingStyleService.create(clinicId, principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Trending style created", data));
    }

    @PutMapping("/trending-styles/{styleId}")
    public ResponseEntity<ResponseMessage<TrendingStyleResponseDto>> updateTrendingStyle(
            @PathVariable UUID clinicId,
            @PathVariable UUID styleId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody TrendingStyleWriteRequest request) {
        TrendingStyleResponseDto data = trendingStyleService.update(clinicId, styleId, principal, request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Trending style updated", data));
    }

    @DeleteMapping("/trending-styles/{styleId}")
    public ResponseEntity<ResponseMessage<Void>> deleteTrendingStyle(
            @PathVariable UUID clinicId,
            @PathVariable UUID styleId,
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        trendingStyleService.delete(clinicId, styleId, principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Trending style removed"));
    }
}
