package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SaasPlanDto {
    String code;
    String label;
    long monthlyPaise;
    String monthlyInrDisplay;
    int trialDays;
    String description;
}
