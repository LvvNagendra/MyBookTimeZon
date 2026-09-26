package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

/** Reusable labelled metric for charts and breakdowns (super-admin console). */
@Value
@Builder
public class AdminMetricPointDto {
    String key;
    String label;
    long value;
}
