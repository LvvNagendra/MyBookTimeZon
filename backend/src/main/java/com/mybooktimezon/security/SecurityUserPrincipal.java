package com.mybooktimezon.security;

import java.util.Collection;
import java.util.List;
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
    private final List<GrantedAuthority> authorities;

    public SecurityUserPrincipal(
            UUID userId,
            String email,
            String passwordHash,
            UserRole role,
            UUID clinicId,
            List<GrantedAuthority> authorities) {
        this.userId = userId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.clinicId = clinicId;
        this.authorities = authorities;
    }

    public static SecurityUserPrincipal authenticated(
            UUID userId, String email, UserRole role, UUID clinicId) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.name());
        List<GrantedAuthority> auths = List.of(authority);
        return new SecurityUserPrincipal(userId, email, null, role, clinicId, auths);
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
