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

    @Column(name = "working_hours_json", columnDefinition = "CLOB")
    private String workingHoursJson;

    @Column(nullable = false)
    private boolean active = true;
}
