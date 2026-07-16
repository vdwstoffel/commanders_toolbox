package com.mtg_app.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

class JwtServiceTest {

	private static final String SECRET = "test-secret-test-secret-test-secret-1234567890";
	private final JwtService jwtService = new JwtService(SECRET, 3600);

	@Test
	void generatesTokenWithUserIdAsSubject() {
		String token = jwtService.generateToken("user-123");

		SecretKey key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
		Jwt decoded = decoder.decode(token);

		assertEquals("user-123", decoded.getSubject());
		assertTrue(decoded.getExpiresAt().isAfter(Instant.now()));
	}
}
