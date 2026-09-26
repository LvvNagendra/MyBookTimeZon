package com.mybooktimezon.web.mapper;

import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.RoleLabels;
import com.mybooktimezon.web.dto.response.UserResponseDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    @Mapping(target = "roleLabel", expression = "java(roleLabel(entity))")
    UserResponseDto toDto(UserAccount entity);

    default String roleLabel(UserAccount entity) {
        return entity == null ? null : RoleLabels.displayName(entity.getRole());
    }
}
