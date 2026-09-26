package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class RolePermissionsUpdateRequest {

    @NotNull
    private List<String> permissionCodes;
}
