package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.PlatformModule;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformModuleRepository extends JpaRepository<PlatformModule, UUID> {
    Optional<PlatformModule> findByCodeIgnoreCase(String code);

    List<PlatformModule> findByActiveTrueOrderByLabelAsc();

    List<PlatformModule> findAllByOrderByLabelAsc();
}
