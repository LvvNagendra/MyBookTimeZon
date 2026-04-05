package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.config.JwtProperties;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ClinicMembership;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.ClinicMembershipRole;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import com.mybooktimezon.repository.ClinicMembershipRepository;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.UserAccountRepository;
import com.mybooktimezon.security.CustomUserDetailsService;
import com.mybooktimezon.security.JwtTokenProvider;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AuthService;
import com.mybooktimezon.web.dto.request.LoginRequest;
import com.mybooktimezon.web.dto.request.RegisterClinicRequest;
import com.mybooktimezon.web.dto.response.AuthResponse;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import com.mybooktimezon.web.dto.response.ProfileResponse;
import com.mybooktimezon.web.dto.response.UserResponseDto;
import com.mybooktimezon.web.mapper.ClinicMapper;
import com.mybooktimezon.web.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LogManager.getLogger(AuthServiceImpl.class);

    private final UserAccountRepository userAccountRepository;
    private final ClinicRepository clinicRepository;
    private final ClinicMembershipRepository clinicMembershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final UserMapper userMapper;
    private final ClinicMapper clinicMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterClinicRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String slug = request.getSlug().trim().toLowerCase();

        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (clinicRepository.existsBySlugIgnoreCase(slug)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Booking URL slug is already taken");
        }

        try {
            UserAccount user = new UserAccount();
            user.setEmail(email);
            user.setName(request.getName().trim());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setRole(UserRole.CLINIC_ADMIN);
            user.setStatus(UserStatus.ACTIVE);
            userAccountRepository.save(user);

            Clinic clinic = new Clinic();
            clinic.setBusinessName(request.getBusinessName().trim());
            clinic.setSlug(slug);
            clinic.setBusinessType(request.getBusinessType());
            clinicRepository.save(clinic);

            ClinicMembership membership = new ClinicMembership();
            membership.setClinic(clinic);
            membership.setUser(user);
            membership.setClinicRole(ClinicMembershipRole.CLINIC_ADMIN);
            clinicMembershipRepository.save(membership);

            log.info("Registered clinic admin {} for clinic {}", email, slug);

            UserDetails details = customUserDetailsService.loadUserByUsername(email);
            SecurityUserPrincipal principal = (SecurityUserPrincipal) details;
            return buildAuthResponse(principal);
        } catch (BusinessException ex) {
            throw ex;
        } catch (DataIntegrityViolationException ex) {
            log.warn("Integrity violation on register: {}", ex.getMessage());
            throw new BusinessException(
                    HttpStatus.CONFLICT, "Email or slug already in use", ex);
        } catch (Exception ex) {
            log.error("Register failed for {}", email, ex);
            throw new BusinessException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Registration could not be completed", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(email, request.getPassword()));
            SecurityUserPrincipal principal = (SecurityUserPrincipal) authentication.getPrincipal();
            log.debug("User authenticated: {}", email);
            return buildAuthResponse(principal);
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Login error", ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Login failed", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(SecurityUserPrincipal principal) {
        try {
            UserAccount user =
                    userAccountRepository
                            .findById(principal.getUserId())
                            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
            UserResponseDto userDto = userMapper.toDto(user);
            ClinicResponseDto clinicDto = null;
            if (principal.getClinicId() != null) {
                clinicDto =
                        clinicRepository
                                .findById(principal.getClinicId())
                                .map(clinicMapper::toDto)
                                .orElse(null);
            }
            return ProfileResponse.builder().user(userDto).clinic(clinicDto).build();
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Profile load failed for user {}", principal.getUserId(), ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not load profile", ex);
        }
    }

    private AuthResponse buildAuthResponse(SecurityUserPrincipal principal) {
        String token = jwtTokenProvider.createAccessToken(principal);
        UserAccount user =
                userAccountRepository
                        .findById(principal.getUserId())
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInMs(jwtProperties.getExpirationMs())
                .user(userMapper.toDto(user))
                .clinicId(principal.getClinicId())
                .build();
    }
}
