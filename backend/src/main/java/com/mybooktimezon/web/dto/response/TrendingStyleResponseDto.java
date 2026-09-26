package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TrendingStyleResponseDto {
    UUID id;
    String title;
    String tagline;
    String imageUrl;
    int sortOrder;
    boolean active;
}
