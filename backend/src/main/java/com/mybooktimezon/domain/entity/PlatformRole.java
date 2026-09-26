package com.mybooktimezon.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "platform_roles")
@Getter
@Setter
public class PlatformRole extends AuditedEntity {

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(length = 500)
    private String description;

    /** PLATFORM | TENANT | CUSTOMER */
    @Column(nullable = false, length = 32)
    private String scope;

    @ColumnDefault("true")
    @Column(name = "system_role", nullable = false)
    private boolean systemRole = true;

    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean active = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<PlatformPermission> permissions = new HashSet<>();
}
