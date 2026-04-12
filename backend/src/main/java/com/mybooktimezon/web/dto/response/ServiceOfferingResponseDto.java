package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ServiceOfferingResponseDto {
    UUID id;
    String name;
    String category;
    int durationMinutes;
    long priceCents;
    Integer taxRateBps;
    String description;
    boolean active;
}
