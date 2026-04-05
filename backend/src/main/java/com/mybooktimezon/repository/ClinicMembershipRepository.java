package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ClinicMembership;
import com.mybooktimezon.domain.entity.UserAccount;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicMembershipRepository extends JpaRepository<ClinicMembership, UUID> {

    List<ClinicMembership> findByUser_Id(UUID userId);

    Optional<ClinicMembership> findByUserAndClinic(UserAccount user, Clinic clinic);

    boolean existsByUser_IdAndClinic_Id(UUID userId, UUID clinicId);
}
