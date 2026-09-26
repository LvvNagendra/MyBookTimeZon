package com.mybooktimezon.web.dto.request;

import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminAssignSubscriptionRequest {

    @NotNull
    private SubscriptionPlan plan;

    /** When null, ACTIVE is used if activate is true; otherwise plan is stored without status change. */
    private SubscriptionStatus status;

    /** When true, clears suspension and sets status ACTIVE (or {@link #status} if provided). */
    private boolean activate = true;
}
