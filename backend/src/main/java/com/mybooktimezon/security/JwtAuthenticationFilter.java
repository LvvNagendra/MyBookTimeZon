package com.mybooktimezon.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LogManager.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            resolveToken(request)
                    .ifPresent(
                            token -> {
                                try {
                                    Claims claims = jwtTokenProvider.parseClaims(token);
                                    SecurityUserPrincipal principal = jwtTokenProvider.toPrincipal(claims);
                                    var authentication =
                                            new UsernamePasswordAuthenticationToken(
                                                    principal, null, principal.getAuthorities());
                                    SecurityContextHolder.getContext().setAuthentication(authentication);
                                } catch (Exception ex) {
                                    log.debug("Invalid JWT: {}", ex.getMessage());
                                    SecurityContextHolder.clearContext();
                                }
                            });
        } catch (Exception ex) {
            log.warn("JWT filter error", ex);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private java.util.Optional<String> resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return java.util.Optional.of(header.substring(7).trim());
        }
        return java.util.Optional.empty();
    }
}
