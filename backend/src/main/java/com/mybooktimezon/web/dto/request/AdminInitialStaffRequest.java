package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Optional first stylist added when super-admin provisions a tenant.
 * Data stays scoped to that tenant only (no cross-tenant references).
 */
@Data
public class AdminInitialStaffRequest {

    @NotBlank(message = "Staff display name is required when initial staff is sent")
    @Size(max = 200)
    private String displayName;

    @Size(max = 255)
    private String specialization;

    @Email(message = "Staff email must be valid when provided")
    @Size(max = 255)
    private String email;

    /** Optional 10-digit Indian mobile for roster / SMS later. */
    private String mobile;

    /** e.g. FEMALE, MALE, UNSPECIFIED — stored as label only. */
    @Size(max = 32)
    private String gender;

    /**
     * How many overlapping appointments this person can handle (1 = one at a time).
     * Tenant refines this later under Staff.
     */
    @Min(1)
    @Max(50)
    private Integer parallelBookingsMax;

    /** Optional JSON weekly template; if omitted, tenant sets later in dashboard. */
    private String workingHoursJson;
}
