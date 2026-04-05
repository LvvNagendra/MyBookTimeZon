package com.mybooktimezon.security;

import com.mybooktimezon.config.JwtProperties;
import com.mybooktimezon.domain.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
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
        return SecurityUserPrincipal.authenticated(userId, email, role, clinicId);
    }
}
