package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.PaymentFlowService;
import com.mybooktimezon.web.dto.request.SaasSubscribeRequest;
import com.mybooktimezon.web.dto.response.PaymentCheckoutDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/clinics/{clinicId}/payments")
@Tag(name = "Payments", description = "SaaS subscription checkout (money to platform).")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@RequiredArgsConstructor
public class TenantPaymentController {

    private final PaymentFlowService paymentFlowService;

    @PostMapping("/saas/checkout")
    public ResponseEntity<ResponseMessage<PaymentCheckoutDto>> saasCheckout(
            @PathVariable UUID clinicId,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody SaasSubscribeRequest request) {
        PaymentCheckoutDto data = paymentFlowService.startSaasSubscription(clinicId, principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Checkout created", data));
    }

    /** Dev / mock: marks a platform subscription ledger as paid and activates the tenant. */
    @PostMapping("/saas/confirm-mock/{ledgerId}")
    public ResponseEntity<ResponseMessage<String>> saasConfirmMock(
            @PathVariable UUID clinicId,
            @PathVariable UUID ledgerId,
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        paymentFlowService.confirmSaasSubscriptionMock(clinicId, principal, ledgerId);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Subscription activated", "OK"));
    }
}
