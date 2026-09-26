package com.mybooktimezon.bootstrap;

import com.mybooktimezon.config.SaaSProperties;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import com.mybooktimezon.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@Order(1)
@RequiredArgsConstructor
public class SuperAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LogManager.getLogger(SuperAdminBootstrap.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final SaaSProperties saaSProperties;

    @Override
    public void run(ApplicationArguments args) {
        SaaSProperties.BootstrapSuperAdmin cfg = saaSProperties.getBootstrapSuperAdmin();
        if (!cfg.isEnabled()) {
            return;
        }
        String email = cfg.getEmail().trim().toLowerCase();
        String rawPassword = cfg.getPassword();
        if (!StringUtils.hasText(rawPassword)) {
            log.error(
                    "saas.bootstrap-super-admin.password is empty — check YAML (quote values that contain @ or !).");
            return;
        }
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            UserAccount existing =
                    userAccountRepository.findByEmailIgnoreCase(email).orElseThrow();
            if (existing.getRole() != UserRole.SUPER_ADMIN) {
                log.warn(
                        "Bootstrap email {} exists but role is {} — not changing password",
                        email,
                        existing.getRole());
                return;
            }
            String hash = existing.getPasswordHash();
            boolean matchesStored = hash != null && passwordEncoder.matches(rawPassword, hash);
            if (cfg.isForceSyncPassword() || !matchesStored) {
                existing.setPasswordHash(passwordEncoder.encode(rawPassword));
                userAccountRepository.save(existing);
                log.info(
                        "Updated bootstrap super admin password for {} (config no longer matched stored hash, or force-sync is on)",
                        email);
            }
            return;
        }
        UserAccount u = new UserAccount();
        u.setEmail(email);
        u.setName(cfg.getName());
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setRole(UserRole.SUPER_ADMIN);
        u.setStatus(UserStatus.ACTIVE);
        userAccountRepository.save(u);
        log.info("Created bootstrap super admin {}", email);
    }
}
