package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StaffMemberWriteRequest {

    @Size(max = 200)
    private String displayName;

    @Size(max = 255)
    private String specialization;

    /** Weekly / monthly availability JSON (e.g. hours per weekday). */
    private String workingHoursJson;

    @Email
    @Size(max = 255)
    private String email;

    @Size(max = 32)
    private String mobile;

    @Size(max = 32)
    private String gender;

    @Min(1)
    @Max(50)
    private Integer parallelBookingsMax;

    @Size(max = 1024)
    private String photoUrl;

    private Boolean active;

    /**
     * When set with email on create, provisions a STAFF login (UserAccount + membership) linked to this
     * roster row so stylists/doctors can sign in.
     */
    @Size(min = 8, max = 100)
    private String loginPassword;
}
