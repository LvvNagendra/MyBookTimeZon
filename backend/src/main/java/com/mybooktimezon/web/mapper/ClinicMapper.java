package com.mybooktimezon.web.mapper;

import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.web.dto.request.ClinicUpdateRequest;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ClinicMapper {

    ClinicResponseDto toDto(Clinic entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateClinicFromRequest(ClinicUpdateRequest request, @MappingTarget Clinic clinic);
}
