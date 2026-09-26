package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.TrendingStyleWriteRequest;
import com.mybooktimezon.web.dto.response.TrendingStyleResponseDto;
import java.util.List;
import java.util.UUID;

public interface TrendingStyleService {

    List<TrendingStyleResponseDto> listForTenant(UUID clinicId, SecurityUserPrincipal principal);

    List<TrendingStyleResponseDto> listPublicForClinic(UUID clinicId);

    TrendingStyleResponseDto create(UUID clinicId, SecurityUserPrincipal principal, TrendingStyleWriteRequest request);

    TrendingStyleResponseDto update(
            UUID clinicId, UUID styleId, SecurityUserPrincipal principal, TrendingStyleWriteRequest request);

    void delete(UUID clinicId, UUID styleId, SecurityUserPrincipal principal);
}
