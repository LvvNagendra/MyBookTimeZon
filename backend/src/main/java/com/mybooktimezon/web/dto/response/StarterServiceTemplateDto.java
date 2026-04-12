package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

/** Suggested first services for onboarding — static catalog, never copied from other tenants. */
@Value
@Builder
public class StarterServiceTemplateDto {
    String name;
    String category;
    int durationMinutes;
    long priceCents;
}
