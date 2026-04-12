package com.mybooktimezon.service.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ServiceOffering;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.ServiceOfferingRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.ServiceOfferingService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.request.ServiceOfferingWriteRequest;
import com.mybooktimezon.web.dto.response.ServiceOfferingResponseDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ServiceOfferingServiceImpl implements ServiceOfferingService {

    private static final long MIN_PRICE_PAISE = 10_000L;

    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ClinicRepository clinicRepository;
    private final TenantPolicyService tenantPolicyService;

    @Override
    @Transactional(readOnly = true)
    public List<ServiceOfferingResponseDto> list(UUID clinicId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        return serviceOfferingRepository.findByClinic_IdOrderByNameAsc(clinicId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listDistinctCategories(UUID clinicId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        return serviceOfferingRepository.findDistinctCategoriesByClinicId(clinicId).stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .toList();
    }

    @Override
    @Transactional
    public ServiceOfferingResponseDto create(
            UUID clinicId, SecurityUserPrincipal principal, ServiceOfferingWriteRequest request) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        String name = request.getName().trim();
        assertUniqueServiceName(clinicId, name, null);
        assertMinPrice(request.getPriceCents());
        ServiceOffering s = new ServiceOffering();
        s.setClinic(clinic);
        s.setName(name);
        s.setCategory(request.getCategory() != null ? request.getCategory().trim() : null);
        s.setDurationMinutes(request.getDurationMinutes());
        s.setPriceCents(request.getPriceCents());
        s.setTaxRateBps(request.getTaxRateBps());
        s.setDescription(request.getDescription());
        s.setActive(request.getActive() == null || request.getActive());
        serviceOfferingRepository.save(s);
        return toDto(s);
    }

    @Override
    @Transactional
    public ServiceOfferingResponseDto update(
            UUID clinicId, UUID serviceId, SecurityUserPrincipal principal, ServiceOfferingWriteRequest request) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        ServiceOffering s =
                serviceOfferingRepository
                        .findByIdAndClinic_Id(serviceId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        applyWrite(request, s);
        assertUniqueServiceName(clinicId, s.getName(), serviceId);
        assertMinPrice(s.getPriceCents());
        serviceOfferingRepository.save(s);
        return toDto(s);
    }

    private void assertMinPrice(long pricePaise) {
        if (pricePaise < MIN_PRICE_PAISE) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "Price must be at least ₹100 (" + MIN_PRICE_PAISE + " paise)");
        }
    }

    private void assertUniqueServiceName(UUID clinicId, String name, UUID excludeServiceId) {
        if (name == null || name.isBlank()) {
            return;
        }
        boolean dup =
                excludeServiceId == null
                        ? serviceOfferingRepository.existsByClinic_IdAndNameIgnoreCase(clinicId, name)
                        : serviceOfferingRepository.existsByClinic_IdAndNameIgnoreCaseAndIdNot(
                                clinicId, name, excludeServiceId);
        if (dup) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "A service with this name already exists for your business (case-insensitive).");
        }
    }

    private Clinic loadClinic(UUID clinicId) {
        return clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));
    }

    private void applyWrite(ServiceOfferingWriteRequest request, ServiceOffering s) {
        if (request.getName() != null) {
            s.setName(request.getName().trim());
        }
        if (request.getCategory() != null) {
            s.setCategory(request.getCategory().trim());
        }
        s.setDurationMinutes(request.getDurationMinutes());
        s.setPriceCents(request.getPriceCents());
        if (request.getTaxRateBps() != null) {
            s.setTaxRateBps(request.getTaxRateBps());
        }
        if (request.getDescription() != null) {
            s.setDescription(request.getDescription());
        }
        if (request.getActive() != null) {
            s.setActive(request.getActive());
        }
    }

    private ServiceOfferingResponseDto toDto(ServiceOffering s) {
        return ServiceOfferingResponseDto.builder()
                .id(s.getId())
                .name(s.getName())
                .category(s.getCategory())
                .durationMinutes(s.getDurationMinutes())
                .priceCents(s.getPriceCents())
                .taxRateBps(s.getTaxRateBps())
                .description(s.getDescription())
                .active(s.isActive())
                .build();
    }
}
