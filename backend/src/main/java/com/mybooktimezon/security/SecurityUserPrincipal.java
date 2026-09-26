package com.mybooktimezon.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.mybooktimezon.domain.enums.UserRole;
import lombok.Getter;

@Getter
public class SecurityUserPrincipal implements UserDetails {

    private final UUID userId;
    private final String email;
    private final String passwordHash;
    private final UserRole role;
    private final UUID clinicId;
    private final Set<String> permissionCodes;
    private final List<GrantedAuthority> authorities;

    public SecurityUserPrincipal(
            UUID userId,
            String email,
            String passwordHash,
            UserRole role,
            UUID clinicId,
            Collection<String> permissionCodes,
            List<GrantedAuthority> authorities) {
        this.userId = userId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.clinicId = clinicId;
        this.permissionCodes =
                permissionCodes == null
                        ? Set.of()
                        : Set.copyOf(new LinkedHashSet<>(permissionCodes));
        this.authorities = authorities;
    }

    public static SecurityUserPrincipal authenticated(
            UUID userId, String email, UserRole role, UUID clinicId) {
        return authenticated(userId, email, role, clinicId, List.of());
    }

    public static SecurityUserPrincipal authenticated(
            UUID userId,
            String email,
            UserRole role,
            UUID clinicId,
            Collection<String> permissionCodes) {
        List<GrantedAuthority> auths = buildAuthorities(role, permissionCodes);
        return new SecurityUserPrincipal(userId, email, null, role, clinicId, permissionCodes, auths);
    }

    public static List<GrantedAuthority> buildAuthorities(
            UserRole role, Collection<String> permissionCodes) {
        List<GrantedAuthority> auths = new ArrayList<>();
        if (role != null) {
            auths.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        }
        if (permissionCodes != null) {
            for (String code : permissionCodes) {
                if (code == null || code.isBlank()) continue;
                auths.add(new SimpleGrantedAuthority("PERM_" + code.trim()));
            }
        }
        return List.copyOf(auths);
    }

    public boolean hasPermission(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        return permissionCodes.contains(code);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash != null ? passwordHash : "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
