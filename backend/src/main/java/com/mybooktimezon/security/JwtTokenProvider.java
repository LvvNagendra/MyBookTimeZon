package com.mybooktimezon.security;

import com.mybooktimezon.config.JwtProperties;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.service.PlatformCatalogService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;
    private final PlatformCatalogService platformCatalogService;

    public JwtTokenProvider(
            JwtProperties jwtProperties, @Lazy PlatformCatalogService platformCatalogService) {
        this.jwtProperties = jwtProperties;
        this.platformCatalogService = platformCatalogService;
        this.secretKey = Keys.hmacShaKeyFor(padTo32Bytes(jwtProperties.getSecret()));
    }

    private static byte[] padTo32Bytes(String secret) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        if (raw.length >= 32) {
            return Arrays.copyOf(raw, 32);
        }
        byte[] padded = new byte[32];
        System.arraycopy(raw, 0, padded, 0, raw.length);
        return padded;
    }

    public String createAccessToken(SecurityUserPrincipal principal) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtProperties.getExpirationMs());
        var builder = Jwts.builder()
                .subject(principal.getUserId().toString())
                .issuedAt(now)
                .expiration(exp)
                .claim("email", principal.getEmail())
                .claim("role", principal.getRole().name());
        if (principal.getClinicId() != null) {
            builder.claim("clinicId", principal.getClinicId().toString());
        }
        if (principal.getPermissionCodes() != null && !principal.getPermissionCodes().isEmpty()) {
            builder.claim("perms", String.join(",", principal.getPermissionCodes()));
        }
        return builder.signWith(secretKey).compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }

    public SecurityUserPrincipal toPrincipal(Claims claims) {
        UUID userId = UUID.fromString(claims.getSubject());
        String email = claims.get("email", String.class);
        UserRole role = UserRole.valueOf(claims.get("role", String.class));
        String clinicStr = claims.get("clinicId", String.class);
        UUID clinicId = clinicStr != null && !clinicStr.isBlank() ? UUID.fromString(clinicStr) : null;

        // Prefer live catalog permissions so role-permission edits apply without re-login
        Set<String> permissions = new LinkedHashSet<>(platformCatalogService.resolvePermissionCodes(role));
        if (permissions.isEmpty()) {
            permissions.addAll(parsePermsClaim(claims.get("perms")));
        }
        return SecurityUserPrincipal.authenticated(userId, email, role, clinicId, permissions);
    }

    private static Collection<String> parsePermsClaim(Object raw) {
        if (raw == null) {
            return List.of();
        }
        if (raw instanceof Collection<?> col) {
            List<String> out = new ArrayList<>();
            for (Object o : col) {
                if (o != null && !o.toString().isBlank()) {
                    out.add(o.toString().trim());
                }
            }
            return out;
        }
        String s = raw.toString().trim();
        if (s.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }
}
