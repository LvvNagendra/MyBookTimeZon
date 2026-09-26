package com.mybooktimezon.security;

import com.mybooktimezon.domain.entity.ClinicMembership;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.ClinicMembershipRole;
import com.mybooktimezon.domain.enums.UserStatus;
import com.mybooktimezon.repository.ClinicMembershipRepository;
import com.mybooktimezon.repository.UserAccountRepository;
import com.mybooktimezon.service.PlatformCatalogService;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LogManager.getLogger(CustomUserDetailsService.class);

    private final UserAccountRepository userAccountRepository;
    private final ClinicMembershipRepository clinicMembershipRepository;
    private final PlatformCatalogService platformCatalogService;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        try {
            UserAccount user = userAccountRepository
                    .findByEmailIgnoreCase(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            if (user.getStatus() != UserStatus.ACTIVE) {
                log.warn("Login attempt for non-active user: {}", username);
                throw new UsernameNotFoundException("User is not active");
            }

            UUID clinicId = resolvePrimaryClinicId(user.getId());
            Set<String> permissions = platformCatalogService.resolvePermissionCodes(user.getRole());
            List<GrantedAuthority> auths =
                    SecurityUserPrincipal.buildAuthorities(user.getRole(), permissions);

            return new SecurityUserPrincipal(
                    user.getId(),
                    user.getEmail(),
                    user.getPasswordHash(),
                    user.getRole(),
                    clinicId,
                    permissions,
                    auths);
        } catch (UsernameNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to load user {}", username, ex);
            throw new UsernameNotFoundException("Authentication failed", ex);
        }
    }

    private UUID resolvePrimaryClinicId(UUID userId) {
        List<ClinicMembership> memberships = clinicMembershipRepository.findByUser_Id(userId);
        return memberships.stream()
                .sorted(Comparator.comparing(m -> m.getClinicRole() != ClinicMembershipRole.TENANT_ADMIN))
                .map(m -> m.getClinic().getId())
                .findFirst()
                .orElse(null);
    }
}
