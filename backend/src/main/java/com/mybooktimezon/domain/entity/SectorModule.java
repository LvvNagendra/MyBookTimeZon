package com.mybooktimezon.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "sector_modules")
@Getter
@Setter
@IdClass(SectorModule.Pk.class)
public class SectorModule {

    @Id
    @Column(name = "sector_id")
    private UUID sectorId;

    @Id
    @Column(name = "module_id")
    private UUID moduleId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sector_id", insertable = false, updatable = false)
    private PlatformSector sector;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", insertable = false, updatable = false)
    private PlatformModule module;

    @ColumnDefault("true")
    @Column(name = "enabled_by_default", nullable = false)
    private boolean enabledByDefault = true;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Pk implements Serializable {
        private UUID sectorId;
        private UUID moduleId;
    }
}
