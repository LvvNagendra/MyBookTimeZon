package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminServiceBriefDto {
    UUID id;
    String name;
    String category;
    int durationMinutes;
    long priceCents;
    boolean active;
}
