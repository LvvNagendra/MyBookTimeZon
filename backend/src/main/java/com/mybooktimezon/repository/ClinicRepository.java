package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.Clinic;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicRepository extends JpaRepository<Clinic, UUID> {

    Optional<Clinic> findBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCase(String slug);
}
