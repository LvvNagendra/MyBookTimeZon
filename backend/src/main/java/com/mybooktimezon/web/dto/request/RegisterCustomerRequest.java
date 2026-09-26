package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterCustomerRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be 8–128 characters")
    private String password;

    /** Indian mobile; validated and normalized to 10 digits in the service layer. */
    @NotBlank(message = "Mobile number is required")
    @Size(max = 32)
    private String mobile;

    /** Optional: HTTPS URL or compressed data URL (same rules as profile PATCH). */
    @Size(max = 360_000)
    private String profilePhotoDataUrl;
}
