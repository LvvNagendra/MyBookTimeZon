package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicRepository extends JpaRepository<Clinic, UUID> {

    Optional<Clinic> findBySlugIgnoreCase(String slug);

    Optional<Clinic> findBySlugIgnoreCaseAndBusinessType(String slug, BusinessType type);

    boolean existsBySlugIgnoreCase(String slug);

    long countBySubscriptionStatus(SubscriptionStatus status);
}
