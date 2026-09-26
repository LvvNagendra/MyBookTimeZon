package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BusinessTypeOptionDto {
    String code;
    String label;
}
