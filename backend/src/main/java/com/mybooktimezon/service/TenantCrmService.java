package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.response.TenantCustomerDto;
import java.util.List;
import java.util.UUID;

public interface TenantCrmService {
    List<TenantCustomerDto> listCustomers(UUID clinicId, SecurityUserPrincipal principal);
}
