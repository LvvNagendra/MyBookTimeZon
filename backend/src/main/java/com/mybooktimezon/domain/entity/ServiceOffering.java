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
@Table(name = "service_offerings")
@Getter
@Setter
public class ServiceOffering extends AuditedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "price_cents", nullable = false)
    private long priceCents;

    @Column(name = "tax_rate_bps")
    private Integer taxRateBps;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean active = true;
}
