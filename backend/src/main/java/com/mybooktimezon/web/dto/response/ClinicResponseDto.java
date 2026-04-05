package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClinicResponseDto {
    UUID id;
    String businessName;
    String slug;
    BusinessType businessType;
    String address;
    String city;
    String timezone;
    String workingHoursJson;
    SubscriptionPlan subscriptionPlan;
    SubscriptionStatus subscriptionStatus;
}
