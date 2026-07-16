package com.mtg_app.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import com.mtg_app.service.JwtService;

class SecurityConfigTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-1234567890";

    @Test
    void jwtDecoderDecodesTokenIssuedByJwtService() {
        JwtService jwtService = new JwtService(SECRET, 3600);
        String token = jwtService.generateToken("user-9");

        JwtDecoder decoder = new SecurityConfig().jwtDecoder(SECRET);
        Jwt jwt = decoder.decode(token);

        assertEquals("user-9", jwt.getSubject());
    }

    @Test
    void jwtDecoderRejectsTokenSignedWithDifferentSecret() {
        JwtService jwtService = new JwtService("another-secret-another-secret-1234567890abcd", 3600);
        String token = jwtService.generateToken("user-9");

        JwtDecoder decoder = new SecurityConfig().jwtDecoder(SECRET);
        assertThrows(JwtException.class, () -> decoder.decode(token));
    }
}
