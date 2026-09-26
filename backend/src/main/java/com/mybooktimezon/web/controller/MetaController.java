package com.mybooktimezon.web.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.NotificationProperties;
import com.mybooktimezon.config.SaaSProperties;
import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.meta.IndiaGeoCatalog;
import com.mybooktimezon.meta.StarterServiceCatalog;
import com.mybooktimezon.service.PlatformCatalogService;
import com.mybooktimezon.web.dto.response.BusinessTypeOptionDto;
import com.mybooktimezon.web.dto.response.IndiaGeoDto;
import com.mybooktimezon.web.dto.response.ModuleDto;
import com.mybooktimezon.web.dto.response.SaasPlanDto;
import com.mybooktimezon.web.dto.response.SectorDto;
import com.mybooktimezon.web.dto.response.StarterServiceTemplateDto;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/meta")
@Tag(name = "Meta", description = "Public catalog for UI (business categories).")
@RequiredArgsConstructor
public class MetaController {

    private final NotificationProperties notificationProperties;
    private final PlatformCatalogService platformCatalogService;
    private final SaaSProperties saaSProperties;

    @GetMapping("/business-types")
    public ResponseEntity<ResponseMessage<List<BusinessTypeOptionDto>>> businessTypes() {
        List<BusinessTypeOptionDto> data =
                platformCatalogService.listActiveSectors().stream()
                        .map(
                                s ->
                                        BusinessTypeOptionDto.builder()
                                                .code(s.getCode())
                                                .label(s.getLabel())
                                                .build())
                        .toList();
        if (data.isEmpty()) {
            data =
                    Arrays.stream(BusinessType.values())
                            .map(
                                    t ->
                                            BusinessTypeOptionDto.builder()
                                                    .code(t.name())
                                                    .label(t.getDisplayLabel())
                                                    .build())
                            .toList();
        }
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Business types", data));
    }

    /** Dynamic sectors with attached feature modules (Phase 0 catalog). */
    @GetMapping("/sectors")
    public ResponseEntity<ResponseMessage<List<SectorDto>>> sectors() {
        List<SectorDto> data = platformCatalogService.listActiveSectors();
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Sectors", data));
    }

    @GetMapping("/sectors/modules")
    public ResponseEntity<ResponseMessage<List<ModuleDto>>> sectorModules(
            @RequestParam(name = "sector", defaultValue = "SALON") String sector) {
        List<ModuleDto> data = platformCatalogService.listModulesForSectorCode(sector);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Sector modules", data));
    }

    /** India states and cities for cascading dropdowns (no third-party API). */
    @GetMapping("/geo/india")
    public ResponseEntity<ResponseMessage<IndiaGeoDto>> indiaGeo() {
        Map<String, List<String>> byState = IndiaGeoCatalog.citiesByState();
        List<String> states = new ArrayList<>(byState.keySet());
        IndiaGeoDto data = IndiaGeoDto.builder().states(states).citiesByState(byState).build();
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "India regions", data));
    }

    /**
     * Labels for tenant staff forms (roster only). Tenants still only see their own staff/services via
     * {@code /clinics/{theirClinicId}/…}.
     */
    /**
     * Suggested starter services for super-admin “add tenant” — static suggestions by business type.
     * Never reads other tenants’ rows from the database.
     */
    @GetMapping("/starter-service-templates")
    public ResponseEntity<ResponseMessage<List<StarterServiceTemplateDto>>> starterServiceTemplates(
            @RequestParam(name = "businessType", defaultValue = "SALON") String businessTypeCode) {
        BusinessType bt;
        try {
            bt = BusinessType.valueOf(businessTypeCode.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            bt = BusinessType.SALON;
        }
        List<StarterServiceTemplateDto> data = StarterServiceCatalog.forType(bt);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Starter service templates", data));
    }

    @GetMapping("/staff-profile-options")
    public ResponseEntity<ResponseMessage<Map<String, Object>>> staffProfileOptions() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put(
                "genders",
                List.of("UNSPECIFIED", "FEMALE", "MALE", "NON_BINARY", "PREFER_NOT_TO_SAY"));
        data.put(
                "parallelBookingsHelp",
                "Max overlapping appointments this stylist accepts (1 = one client at a time).");
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Staff form options", data));
    }

    /**
     * Describes outbound email features (toggles + templates). SMS/push are not implemented yet — UI can show
     * “coming soon” for those channels.
     */
    @GetMapping("/saas-plans")
    public ResponseEntity<ResponseMessage<List<SaasPlanDto>>> saasPlans() {
        int trial = saaSProperties.getTrialDays();
        List<SaasPlanDto> plans = List.of(
                plan(SubscriptionPlan.BASIC, "Basic", saaSProperties.getBasicMonthlyPaise(), trial,
                        "Core booking, staff roster, and customer CRM."),
                plan(SubscriptionPlan.STANDARD, "Standard", saaSProperties.getStandardMonthlyPaise(), trial,
                        "Everything in Basic plus analytics-ready modules when enabled."),
                plan(SubscriptionPlan.PREMIUM, "Premium", saaSProperties.getPremiumMonthlyPaise(), trial,
                        "Full platform pack — priority onboarding and premium catalogue price."));
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "SaaS plans", plans));
    }

    private static SaasPlanDto plan(SubscriptionPlan code, String label, long paise, int trial, String desc) {
        long inr = paise / 100;
        return SaasPlanDto.builder()
                .code(code.name())
                .label(label)
                .monthlyPaise(paise)
                .monthlyInrDisplay("INR " + inr)
                .trialDays(trial)
                .description(desc)
                .build();
    }

    @GetMapping("/notifications")
    public ResponseEntity<ResponseMessage<Map<String, Object>>> notificationCatalog() {
        Map<String, Object> data = new LinkedHashMap<>();
        Map<String, Object> email = new LinkedHashMap<>();
        email.put(
                "bookingConfirmation",
                Map.of(
                        "enabled", notificationProperties.isConfirmationEmailEnabled(),
                        "when", "Immediately after a successful online booking (after DB commit).",
                        "template", "HTML: greeting, salon name, service, stylist, local date/time."));
        email.put(
                "dayOfReminder",
                Map.of(
                        "enabled", notificationProperties.isDayReminderEmailEnabled(),
                        "when",
                                "On the appointment date, within "
                                        + notificationProperties.getReminderWindowMinutes()
                                        + " minutes after "
                                        + notificationProperties.getReminderHourLocal()
                                        + ":00 local time (salon timezone); scheduler runs every 10 minutes.",
                        "template", "HTML: short reminder with time and service."));
        email.put(
                "staffCcOnBooking",
                Map.of(
                        "enabled",
                        notificationProperties.isStaffCcOnBooking(),
                        "when",
                        "Same confirmation email as customer, CC roster email when the stylist has one."));
        data.put("email", email);
        data.put(
                "planned",
                List.of(
                        Map.of("channel", "sms", "status", "not_configured", "note", "Twilio or similar — roadmap."),
                        Map.of("channel", "push", "status", "not_configured", "note", "Web push / FCM — roadmap.")));
        data.put("fromAddress", notificationProperties.getFromAddress());
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Notification catalog", data));
    }
}
