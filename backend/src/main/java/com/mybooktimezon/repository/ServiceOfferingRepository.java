package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.ServiceOffering;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {

    long countByClinic_IdAndActiveTrue(UUID clinicId);

    long countByActiveTrue();

    List<ServiceOffering> findByClinic_IdAndActiveTrueOrderByNameAsc(UUID clinicId);

    List<ServiceOffering> findByClinic_IdOrderByNameAsc(UUID clinicId);

    Optional<ServiceOffering> findByIdAndClinic_Id(UUID id, UUID clinicId);

    boolean existsByClinic_IdAndNameIgnoreCase(UUID clinicId, String name);

    boolean existsByClinic_IdAndNameIgnoreCaseAndIdNot(UUID clinicId, String name, UUID id);

    @Query(
            """
            SELECT DISTINCT s.category FROM ServiceOffering s
            WHERE s.clinic.id = :clinicId
            AND s.category IS NOT NULL
            AND s.category <> ''
            ORDER BY s.category
            """)
    List<String> findDistinctCategoriesByClinicId(@Param("clinicId") UUID clinicId);
}
