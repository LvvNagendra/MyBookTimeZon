package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.ClinicTrendingStyle;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicTrendingStyleRepository extends JpaRepository<ClinicTrendingStyle, UUID> {

    List<ClinicTrendingStyle> findByClinic_IdOrderBySortOrderAscCreatedAtAsc(UUID clinicId);

    List<ClinicTrendingStyle> findByClinic_IdAndActiveTrueOrderBySortOrderAscCreatedAtAsc(UUID clinicId);

    Optional<ClinicTrendingStyle> findByIdAndClinic_Id(UUID id, UUID clinicId);
}
