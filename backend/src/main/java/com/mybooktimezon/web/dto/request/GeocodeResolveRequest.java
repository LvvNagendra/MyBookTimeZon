package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GeocodeResolveRequest {

    @NotBlank(message = "Address query is required")
    @Size(max = 500)
    private String query;
}
