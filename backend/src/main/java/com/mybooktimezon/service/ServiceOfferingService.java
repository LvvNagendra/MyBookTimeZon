package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.ServiceOfferingWriteRequest;
import com.mybooktimezon.web.dto.response.ServiceOfferingResponseDto;
import java.util.List;
import java.util.UUID;

public interface ServiceOfferingService {

    List<ServiceOfferingResponseDto> list(UUID clinicId, SecurityUserPrincipal principal);

    /** Distinct non-empty categories from this clinic’s catalogue only (for tenant UI dropdowns). */
    List<String> listDistinctCategories(UUID clinicId, SecurityUserPrincipal principal);

    ServiceOfferingResponseDto create(UUID clinicId, SecurityUserPrincipal principal, ServiceOfferingWriteRequest request);

    ServiceOfferingResponseDto update(
            UUID clinicId, UUID serviceId, SecurityUserPrincipal principal, ServiceOfferingWriteRequest request);
}
