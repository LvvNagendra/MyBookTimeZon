package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.PlatformRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlatformRoleRepository extends JpaRepository<PlatformRole, UUID> {
    Optional<PlatformRole> findByCodeIgnoreCase(String code);

    List<PlatformRole> findByActiveTrueOrderByCodeAsc();

    @Query(
            """
            SELECT DISTINCT r FROM PlatformRole r
            LEFT JOIN FETCH r.permissions
            ORDER BY r.code ASC
            """)
    List<PlatformRole> findAllWithPermissions();

    @Query(
            """
            SELECT r FROM PlatformRole r
            LEFT JOIN FETCH r.permissions
            WHERE r.id = :id
            """)
    Optional<PlatformRole> findByIdWithPermissions(@Param("id") UUID id);

    @Query(
            """
            SELECT DISTINCT p.code FROM PlatformRole r
            JOIN r.permissions p
            WHERE UPPER(r.code) = UPPER(:roleCode) AND r.active = TRUE
            """)
    List<String> findPermissionCodesByRoleCode(@Param("roleCode") String roleCode);
}
