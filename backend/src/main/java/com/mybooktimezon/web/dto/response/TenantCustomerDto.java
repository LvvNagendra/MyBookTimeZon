package com.mybooktimezon.web.dto.response;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TenantCustomerDto {
    UUID customerId;
    String name;
    String email;
    String mobile;
    long visitCount;
    Instant lastVisitAt;
    String lastServiceName;
    String lastStatus;
    String notes;
}
