package com.mybooktimezon.web.dto.request;

import com.mybooktimezon.domain.enums.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaasSubscribeRequest {
    @NotNull private SubscriptionPlan plan;
}
