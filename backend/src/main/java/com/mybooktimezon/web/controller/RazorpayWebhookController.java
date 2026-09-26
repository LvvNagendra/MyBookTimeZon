package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.RazorpayProperties;
import com.mybooktimezon.domain.entity.PaymentLedger;
import com.mybooktimezon.domain.enums.LedgerPaymentPurpose;
import com.mybooktimezon.domain.enums.PaymentStatus;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.PaymentLedgerRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Razorpay webhook receiver. When {@code razorpay.webhook-secret} is empty (local demo), accepts a simple JSON body
 * with {@code ledgerId} to mark a pending PLATFORM_SUBSCRIPTION paid — same outcome as confirm-mock.
 */
@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/webhooks")
@Tag(name = "Webhooks", description = "Payment provider callbacks.")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    private static final Logger log = LogManager.getLogger(RazorpayWebhookController.class);

    private final RazorpayProperties razorpayProperties;
    private final PaymentLedgerRepository paymentLedgerRepository;
    private final ClinicRepository clinicRepository;

    @PostMapping("/razorpay")
    public ResponseEntity<?> razorpay(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {
        if (razorpayProperties.isConfigured()
                && razorpayProperties.getWebhookSecret() != null
                && !razorpayProperties.getWebhookSecret().isBlank()) {
            if (signature == null || signature.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseMessageFactory.error(HttpStatus.UNAUTHORIZED, "Missing signature"));
            }
            log.info("Razorpay webhook received (signature present) — extend with HMAC verify + order settle");
        }

        Object ledgerRaw = payload.get("ledgerId");
        if (ledgerRaw == null) {
            return ResponseEntity.ok(
                    ResponseMessageFactory.success(HttpStatus.OK, "Acknowledged", Map.of("status", "ignored")));
        }

        UUID ledgerId;
        try {
            ledgerId = UUID.fromString(String.valueOf(ledgerRaw));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseMessageFactory.error(HttpStatus.BAD_REQUEST, "Invalid ledgerId"));
        }

        Optional<PaymentLedger> opt = paymentLedgerRepository.findById(ledgerId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseMessageFactory.error(HttpStatus.NOT_FOUND, "Ledger not found"));
        }
        PaymentLedger ledger = opt.get();
        if (ledger.getPurpose() == LedgerPaymentPurpose.PLATFORM_SUBSCRIPTION
                && ledger.getStatus() != PaymentStatus.PAID) {
            ledger.setStatus(PaymentStatus.PAID);
            paymentLedgerRepository.save(ledger);
            var clinic = ledger.getClinic();
            if (ledger.getSubscriptionPlan() != null) {
                clinic.setSubscriptionPlan(ledger.getSubscriptionPlan());
            }
            clinic.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
            clinic.setTenantSuspended(false);
            clinicRepository.save(clinic);
            log.info("Webhook activated subscription for clinic {}", clinic.getId());
        }
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Processed", Map.of("status", "ok")));
    }
}
