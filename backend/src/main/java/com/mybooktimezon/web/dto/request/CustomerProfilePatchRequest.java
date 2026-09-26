package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CustomerProfilePatchRequest {

    /**
     * HTTPS image URL or compressed JPEG/PNG data URL. Empty string clears. Max ~350KB when base64-encoded.
     */
    @Size(max = 360_000)
    private String profilePhotoDataUrl;
}
