package com.mybooktimezon.web.mapper;

import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.web.dto.response.UserResponseDto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    UserResponseDto toDto(UserAccount entity);
}
