package com.mtg_app.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mtg_app.dao.UserRepository;
import com.mtg_app.entity.User;

class AuthServiceTest {

	private final UserRepository userRepository = mock(UserRepository.class);
	private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
	private final JwtService jwtService = mock(JwtService.class);
	private final AuthService authService = new AuthService(userRepository, passwordEncoder, jwtService);

	@Test
	void registerCreatesUserAndReturnsToken() {
		when(userRepository.existsByEmail("a@b.com")).thenReturn(false);
		when(passwordEncoder.encode("pw")).thenReturn("hashed");
		when(jwtService.generateToken(anyString())).thenReturn("token-xyz");

		String token = authService.register("a@b.com", "pw");

		assertEquals("token-xyz", token);
		verify(userRepository).save(any(User.class));
	}

	@Test
	void registerRejectsDuplicateEmail() {
		when(userRepository.existsByEmail("a@b.com")).thenReturn(true);

		RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register("a@b.com", "pw"));
		assertEquals("An account with this email already exists", ex.getMessage());
		verify(userRepository, never()).save(any());
	}

	@Test
	void loginReturnsTokenForValidCredentials() {
		User user = new User("id-1", "a@b.com", "hashed");
		when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);
		when(jwtService.generateToken("id-1")).thenReturn("token-1");

		assertEquals("token-1", authService.login("a@b.com", "pw"));
	}

	@Test
	void loginRejectsWrongPassword() {
		User user = new User("id-1", "a@b.com", "hashed");
		when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

		RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login("a@b.com", "wrong"));
		assertEquals("Invalid email or password", ex.getMessage());
	}
}
