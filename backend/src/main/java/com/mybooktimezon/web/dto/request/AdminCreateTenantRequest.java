package com.mybooktimezon.web.dto.request;

import com.mybooktimezon.domain.enums.BusinessType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class AdminCreateTenantRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 255)
    private String businessName;

    @NotBlank(message = "Slug is required")
    @Size(max = 100)
    private String slug;

    @NotNull(message = "Business type is required")
    private BusinessType businessType;

    @Size(max = 120)
    private String city;

    @Size(max = 120)
    private String country;

    @Size(max = 120)
    private String state;

    @Size(max = 120)
    private String village;

    @Size(max = 200)
    private String displayLocation;

    @Size(max = 4000)
    private String specialties;

    @NotBlank(message = "Salon phone is required")
    private String salonPhone;

    @NotBlank(message = "Owner mobile is required")
    private String ownerMobile;

    @NotBlank(message = "Owner email is required")
    @Email(message = "Owner email must be valid")
    @Size(max = 255)
    private String ownerEmail;

    @NotBlank(message = "Owner password is required")
    @Size(min = 8, max = 128, message = "Owner password must be 8–128 characters")
    private String ownerPassword;

    @Size(max = 4000)
    private String internalNotes;

    /** Optional first stylist for this salon only (never mixes other tenants). */
    @Valid
    private AdminInitialStaffRequest initialStaff;

    /** Optional starter services for this clinic only (new rows, not copied from other tenants). Max 8. */
    @Valid
    @Size(max = 8)
    private List<AdminInitialServiceRequest> initialServices;
}
