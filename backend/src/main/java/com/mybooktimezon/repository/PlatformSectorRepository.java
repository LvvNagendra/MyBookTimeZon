package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.PlatformSector;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSectorRepository extends JpaRepository<PlatformSector, UUID> {
    Optional<PlatformSector> findByCodeIgnoreCase(String code);

    List<PlatformSector> findByActiveTrueOrderBySortOrderAscLabelAsc();

    List<PlatformSector> findAllByOrderBySortOrderAscLabelAsc();

    boolean existsByCodeIgnoreCase(String code);
}
