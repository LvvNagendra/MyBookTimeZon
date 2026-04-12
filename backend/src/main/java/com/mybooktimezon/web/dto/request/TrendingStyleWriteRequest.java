package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TrendingStyleWriteRequest {

    @Size(max = 200)
    private String title;

    @Size(max = 500)
    private String tagline;

    @Size(max = 1024)
    private String imageUrl;

    private Integer sortOrder;

    private Boolean active;
}
