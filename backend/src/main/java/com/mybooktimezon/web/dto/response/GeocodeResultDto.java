package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GeocodeResultDto {
    double latitude;
    double longitude;
    /** Formatted / matched address from the provider. */
    String formattedAddress;
    /** GOOGLE or NOMINATIM */
    String provider;
}
