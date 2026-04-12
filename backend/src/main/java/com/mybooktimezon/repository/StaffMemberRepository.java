package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.StaffMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffMemberRepository extends JpaRepository<StaffMember, UUID> {

    long countByClinic_IdAndActiveTrue(UUID clinicId);

    List<StaffMember> findByClinic_IdAndActiveTrueOrderByDisplayNameAsc(UUID clinicId);

    List<StaffMember> findByClinic_IdOrderByDisplayNameAsc(UUID clinicId);

    Optional<StaffMember> findByIdAndClinic_Id(UUID id, UUID clinicId);

    Optional<StaffMember> findByUser_IdAndClinic_Id(UUID userId, UUID clinicId);

    boolean existsByClinic_IdAndEmailIgnoreCase(UUID clinicId, String email);

    boolean existsByClinic_IdAndEmailIgnoreCaseAndIdNot(UUID clinicId, String email, UUID id);

    boolean existsByClinic_IdAndMobile(UUID clinicId, String mobile);

    boolean existsByClinic_IdAndMobileAndIdNot(UUID clinicId, String mobile, UUID id);
}
