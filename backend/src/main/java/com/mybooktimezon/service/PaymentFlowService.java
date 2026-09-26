package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.SaasSubscribeRequest;
import com.mybooktimezon.web.dto.response.PaymentCheckoutDto;
import java.util.UUID;

public interface PaymentFlowService {

    PaymentCheckoutDto startSaasSubscription(UUID clinicId, SecurityUserPrincipal principal, SaasSubscribeRequest request);

    void confirmSaasSubscriptionMock(UUID clinicId, SecurityUserPrincipal principal, UUID ledgerId);
}
