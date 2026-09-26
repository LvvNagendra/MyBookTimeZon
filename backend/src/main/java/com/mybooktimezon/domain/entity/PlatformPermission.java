package com.mybooktimezon.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "platform_permissions")
@Getter
@Setter
public class PlatformPermission extends AuditedEntity {

    @Column(nullable = false, unique = true, length = 96)
    private String code;

    @Column(nullable = false, length = 160)
    private String label;

    @Column(length = 500)
    private String description;

    @Column(name = "module_code", length = 64)
    private String moduleCode;

    /** PLATFORM | TENANT | CUSTOMER */
    @Column(nullable = false, length = 32)
    private String scope;
}
