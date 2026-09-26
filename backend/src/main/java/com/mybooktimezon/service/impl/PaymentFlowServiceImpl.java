package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.config.RazorpayProperties;
import com.mybooktimezon.config.SaaSProperties;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.PaymentLedger;
import com.mybooktimezon.domain.enums.LedgerPaymentPurpose;
import com.mybooktimezon.domain.enums.PaymentStatus;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.PaymentLedgerRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.PaymentFlowService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.request.SaasSubscribeRequest;
import com.mybooktimezon.web.dto.response.PaymentCheckoutDto;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentFlowServiceImpl implements PaymentFlowService {

    private final PaymentLedgerRepository paymentLedgerRepository;
    private final ClinicRepository clinicRepository;
    private final TenantPolicyService tenantPolicyService;
    private final SaaSProperties saaSProperties;
    private final RazorpayProperties razorpayProperties;

    @Override
    @Transactional
    public PaymentCheckoutDto startSaasSubscription(
            UUID clinicId, SecurityUserPrincipal principal, SaasSubscribeRequest request) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        Clinic clinic = clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));
        long amount = planAmountPaise(request.getPlan());
        PaymentLedger ledger = new PaymentLedger();
        ledger.setClinic(clinic);
        ledger.setPurpose(LedgerPaymentPurpose.PLATFORM_SUBSCRIPTION);
        ledger.setAmountPaise(amount);
        ledger.setStatus(PaymentStatus.PENDING);
        ledger.setSubscriptionPlan(request.getPlan());
        ledger.setRazorpayOrderId("saas_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        paymentLedgerRepository.save(ledger);
        return PaymentCheckoutDto.builder()
                .ledgerId(ledger.getId())
                .razorpayKeyId(razorpayProperties.getKeyId())
                .orderId(ledger.getRazorpayOrderId())
                .amountPaise(amount)
                .currency("INR")
                .mockMode(razorpayProperties.isMockMode())
                .message(
                        razorpayProperties.isMockMode()
                                ? "Preview checkout: call confirm-mock or POST /webhooks/razorpay with {\"ledgerId\": \"...\"}."
                                : "Use Razorpay Checkout.js with this order reference.")
                .build();
    }

    @Override
    @Transactional
    public void confirmSaasSubscriptionMock(UUID clinicId, SecurityUserPrincipal principal, UUID ledgerId) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        PaymentLedger ledger =
                paymentLedgerRepository
                        .findById(ledgerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        if (!ledger.getClinic().getId().equals(clinicId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Payment does not belong to this business");
        }
        if (ledger.getPurpose() != LedgerPaymentPurpose.PLATFORM_SUBSCRIPTION) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Not a platform subscription payment");
        }
        ledger.setStatus(PaymentStatus.PAID);
        Clinic clinic = ledger.getClinic();
        if (ledger.getSubscriptionPlan() != null) {
            clinic.setSubscriptionPlan(ledger.getSubscriptionPlan());
        }
        clinic.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        clinic.setTenantSuspended(false);
        paymentLedgerRepository.save(ledger);
        clinicRepository.save(clinic);
    }

    private long planAmountPaise(SubscriptionPlan plan) {
        return switch (plan) {
            case BASIC -> saaSProperties.getBasicMonthlyPaise();
            case STANDARD -> saaSProperties.getStandardMonthlyPaise();
            case PREMIUM -> saaSProperties.getPremiumMonthlyPaise();
        };
    }
}
