package com.mybooktimezon.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "platform_sectors")
@Getter
@Setter
public class PlatformSector extends AuditedEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(length = 500)
    private String description;

    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
