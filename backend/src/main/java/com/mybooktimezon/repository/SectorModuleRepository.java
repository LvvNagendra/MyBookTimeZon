package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.SectorModule;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SectorModuleRepository extends JpaRepository<SectorModule, SectorModule.Pk> {

    @Query(
            """
            SELECT sm FROM SectorModule sm
            JOIN FETCH sm.module m
            JOIN sm.sector s
            WHERE UPPER(s.code) = UPPER(:sectorCode) AND m.active = TRUE AND sm.enabledByDefault = TRUE
            ORDER BY m.label ASC
            """)
    List<SectorModule> findEnabledModulesForSectorCode(@Param("sectorCode") String sectorCode);

    List<SectorModule> findBySectorId(UUID sectorId);

    @Query(
            """
            SELECT sm FROM SectorModule sm
            JOIN FETCH sm.module m
            WHERE sm.sectorId = :sectorId
            ORDER BY m.label ASC
            """)
    List<SectorModule> findBySectorIdWithModule(@Param("sectorId") UUID sectorId);
}
