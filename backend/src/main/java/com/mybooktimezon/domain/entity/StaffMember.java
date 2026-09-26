package com.mybooktimezon.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "staff_members")
@Getter
@Setter
public class StaffMember extends AuditedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(length = 255)
    private String specialization;

    @Column(name = "working_hours_json", columnDefinition = "TEXT")
    private String workingHoursJson;

    /** Reminder / contact for roster (optional). */
    @Column(length = 255)
    private String email;

    @Column(length = 32)
    private String mobile;

    /** Optional roster label, e.g. FEMALE, MALE, UNSPECIFIED — not used for access control. */
    @Column(length = 32)
    private String gender;

    /**
     * Max overlapping confirmed appointments this stylist can carry (salon-defined capacity).
     * Default 1 = one customer at a time.
     */
    @Column(name = "parallel_bookings_max", nullable = false)
    private int parallelBookingsMax = 1;

    @Column(name = "photo_url", length = 1024)
    private String photoUrl;

    @Column(nullable = false)
    private boolean active = true;
}
