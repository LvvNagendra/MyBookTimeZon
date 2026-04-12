package com.mybooktimezon.web.dto.response;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Value;

/** Static India region catalog for cascading location dropdowns (no external API key). */
@Value
@Builder
public class IndiaGeoDto {
    List<String> states;
    Map<String, List<String>> citiesByState;
}
