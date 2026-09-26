package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.PlatformPermission;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformPermissionRepository extends JpaRepository<PlatformPermission, UUID> {
    Optional<PlatformPermission> findByCodeIgnoreCase(String code);

    List<PlatformPermission> findAllByOrderByCodeAsc();
}
