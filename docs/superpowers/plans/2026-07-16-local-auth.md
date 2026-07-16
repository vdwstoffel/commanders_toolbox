# Local Email/Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Auth0/Okta with self-hosted email/password auth where the Spring Boot server issues and validates its own HS256 JWTs.

**Architecture:** The server gains a `users` table, an `AuthController` (`/api/v1/auth`, public) backed by an `AuthService` (BCrypt hashing) and a `JwtService` (issues HS256 tokens with the user id in `sub`). Spring Security is reconfigured to validate those tokens with a symmetric-key `JwtDecoder` instead of the Okta starter. `DeckController` is unchanged — it still reads `jwt.getSubject()`. The client drops the Auth0 SDK: `UserContextProvider` stores the token in `localStorage` and exposes `login`/`register`/`logout`; new Login/Register pages and an updated Navbar/AuthWrapper drive the flow.

**Tech Stack:** Server — Spring Boot 3.4.5, Java 21, Spring Security OAuth2 Resource Server + JOSE (Nimbus), JPA/Hibernate, PostgreSQL, JUnit 5 + Mockito. Client — React 19, TypeScript, Vite, React Router v7, axios, Tailwind v4 + shadcn/ui, Vitest + React Testing Library.

## Global Constraints

- **Server indentation:** tabs (existing files use tabs). **No Lombok** — hand-write no-arg + all-args constructors, getters/setters, and `toString()` where the codebase does. Use `jakarta.persistence.*` (not `javax`).
- **Server errors:** throw plain `RuntimeException` for validation/ownership failures. The global `RestExceptionHandler` (`com.mtg_app.controllers`) turns every exception into HTTP 400 + `AppErrorResponse { status, message, timeStamp }`. Do not craft custom status codes.
- **Server packages:** base package `com.mtg_app`. Entities → `com.mtg_app.entity`, repositories → `com.mtg_app.dao`, services + interfaces → `com.mtg_app.service`, DTOs → `com.mtg_app.dto`, controllers → `com.mtg_app.controllers`, security → `com.mtg_app.security`.
- **Server tests** run via targeted class execution (`./mvnw test -Dtest=ClassName`) to avoid the pre-existing DB-dependent `MtgAppApplicationTests.contextLoads()` `@SpringBootTest`. All new server tests are pure unit tests (no Spring context, no database).
- **JWT secret** must be ≥ 32 bytes (HS256/`HmacSHA256`). Token subject (`sub`) = the user's UUID id. TTL = 604800 seconds (7 days).
- **Client formatting:** Prettier `printWidth: 133`, `tabWidth: 2`. Tests are colocated in `__tests__/` folders. Vitest globals are enabled (`describe`/`it`/`expect`/`vi` are global — do NOT import them, matching existing tests). The `@` alias maps to `client/src`.
- **Client token storage key:** `localStorage` key `"idToken"`.
- **Commits:** short, plain messages. Do NOT add a `Co-Authored-By` trailer.
- **Branch:** all work lands on the existing `local-auth` branch.
- **App boot note:** After Task S1 removes the Okta starter, the server will NOT boot until Task S4 adds the `JwtDecoder` bean. This is expected — Tasks S1–S3 are validated by unit tests only, not by running the app.

---

## Task S1: JWT dependencies, config, and JwtService

**Files:**
- Modify: `server/pom.xml` (dependencies block, ~lines 53-57)
- Modify: `server/src/main/resources/secrets.properties`
- Create: `server/src/main/java/com/mtg_app/service/JwtService.java`
- Test: `server/src/test/java/com/mtg_app/service/JwtServiceTest.java`

**Interfaces:**
- Produces: `JwtService` with public constructor `JwtService(String secret, long ttlSeconds)` (Spring injects via `@Value`) and `public String generateToken(String userId)` returning a signed HS256 JWT whose `sub` is `userId`.

- [ ] **Step 1: Swap the Okta dependency for Spring Security starters in `server/pom.xml`**

Replace this block (currently lines 53-57):

```xml
		<dependency>
			<groupId>com.okta.spring</groupId>
			<artifactId>okta-spring-boot-starter</artifactId>
			<version>3.0.7</version>
		</dependency>
```

with:

```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
		</dependency>
```

- [ ] **Step 2: Replace the Okta properties with JWT properties in `server/src/main/resources/secrets.properties`**

Replace these lines:

```properties
# Okta authentication
okta.oauth2.issuer=https://vdwstoffel.eu.auth0.com/
okta.oauth2.audience=nj17viASV2OeHuF82im1iglm0uEt6XXk
```

with:

```properties
# JWT authentication
app.jwt.secret=change-me-to-a-long-random-secret-at-least-32-bytes-1234567890
app.jwt.ttl-seconds=604800
```

Leave the database configuration block untouched.

- [ ] **Step 3: Write the failing test `JwtServiceTest.java`**

```java
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
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd server && ./mvnw test -Dtest=JwtServiceTest`
Expected: FAIL — compilation error, `cannot find symbol: class JwtService`.

- [ ] **Step 5: Implement `JwtService.java`**

```java
package com.mtg_app.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Service
public class JwtService {

	private final JwtEncoder encoder;
	private final long ttlSeconds;

	public JwtService(@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.ttl-seconds}") long ttlSeconds) {
		SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
		this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
		this.ttlSeconds = ttlSeconds;
	}

	public String generateToken(String userId) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.subject(userId)
				.issuedAt(now)
				.expiresAt(now.plusSeconds(ttlSeconds))
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd server && ./mvnw test -Dtest=JwtServiceTest`
Expected: PASS — `Tests run: 1, Failures: 0, Errors: 0`.

- [ ] **Step 7: Commit**

```bash
git add server/pom.xml server/src/main/resources/secrets.properties \
  server/src/main/java/com/mtg_app/service/JwtService.java \
  server/src/test/java/com/mtg_app/service/JwtServiceTest.java
git commit -m "server: add JwtService for HS256 token issuance; swap okta starter for spring-security"
```

---

## Task S2: User entity, repository, DTOs, and AuthService

**Files:**
- Create: `server/src/main/java/com/mtg_app/entity/User.java`
- Create: `server/src/main/java/com/mtg_app/dao/UserRepository.java`
- Create: `server/src/main/java/com/mtg_app/dto/RegisterRequest.java`
- Create: `server/src/main/java/com/mtg_app/dto/LoginRequest.java`
- Create: `server/src/main/java/com/mtg_app/dto/AuthResponse.java`
- Create: `server/src/main/java/com/mtg_app/service/AuthServiceInterface.java`
- Create: `server/src/main/java/com/mtg_app/service/AuthService.java`
- Test: `server/src/test/java/com/mtg_app/service/AuthServiceTest.java`

**Interfaces:**
- Consumes: `JwtService.generateToken(String userId)` from Task S1.
- Produces:
  - `User` entity — constructor `User(String id, String email, String passwordHash)`, getters `getId()/getEmail()/getPasswordHash()` and matching setters.
  - `UserRepository extends JpaRepository<User, String>` — `Optional<User> findByEmail(String email)`, `boolean existsByEmail(String email)`.
  - `RegisterRequest` / `LoginRequest` — `getEmail()/setEmail`, `getPassword()/setPassword`.
  - `AuthResponse` — constructor `AuthResponse(String token)`, `getToken()/setToken`.
  - `AuthService implements AuthServiceInterface` — constructor `AuthService(UserRepository, PasswordEncoder, JwtService)`, `String register(String email, String password)`, `String login(String email, String password)` (both return a JWT).

- [ ] **Step 1: Write the failing test `AuthServiceTest.java`**

```java
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && ./mvnw test -Dtest=AuthServiceTest`
Expected: FAIL — compilation errors (`User`, `UserRepository`, `AuthService` not found).

- [ ] **Step 3: Create the `User` entity**

`server/src/main/java/com/mtg_app/entity/User.java`. Note `@Table(name = "users")` — `user` is a reserved word in PostgreSQL.

```java
package com.mtg_app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	private String id;

	@Column(unique = true, nullable = false)
	private String email;

	@Column(nullable = false)
	private String passwordHash;

	public User() {
	}

	public User(String id, String email, String passwordHash) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	@Override
	public String toString() {
		return "User{" +
				"id='" + id + '\'' +
				", email='" + email + '\'' +
				'}';
	}
}
```

- [ ] **Step 4: Create the `UserRepository`**

`server/src/main/java/com/mtg_app/dao/UserRepository.java`:

```java
package com.mtg_app.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mtg_app.entity.User;

public interface UserRepository extends JpaRepository<User, String> {
	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);
}
```

- [ ] **Step 5: Create the request/response DTOs**

`server/src/main/java/com/mtg_app/dto/RegisterRequest.java`:

```java
package com.mtg_app.dto;

public class RegisterRequest {
	private String email;
	private String password;

	public RegisterRequest() {
	}

	public RegisterRequest(String email, String password) {
		this.email = email;
		this.password = password;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}
```

`server/src/main/java/com/mtg_app/dto/LoginRequest.java` — identical body to `RegisterRequest` but class name `LoginRequest` and constructor `LoginRequest(String email, String password)`:

```java
package com.mtg_app.dto;

public class LoginRequest {
	private String email;
	private String password;

	public LoginRequest() {
	}

	public LoginRequest(String email, String password) {
		this.email = email;
		this.password = password;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}
```

`server/src/main/java/com/mtg_app/dto/AuthResponse.java`:

```java
package com.mtg_app.dto;

public class AuthResponse {
	private String token;

	public AuthResponse() {
	}

	public AuthResponse(String token) {
		this.token = token;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}
}
```

- [ ] **Step 6: Create the `AuthServiceInterface`**

`server/src/main/java/com/mtg_app/service/AuthServiceInterface.java`:

```java
package com.mtg_app.service;

public interface AuthServiceInterface {
	String register(String email, String password);

	String login(String email, String password);
}
```

- [ ] **Step 7: Implement `AuthService`**

`server/src/main/java/com/mtg_app/service/AuthService.java`:

```java
package com.mtg_app.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.UserRepository;
import com.mtg_app.entity.User;

@Service
public class AuthService implements AuthServiceInterface {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	@Autowired
	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	@Override
	public String register(String email, String password) {
		if (email == null || email.isBlank() || password == null || password.isBlank()) {
			throw new RuntimeException("Email and password are required");
		}
		if (userRepository.existsByEmail(email)) {
			throw new RuntimeException("An account with this email already exists");
		}
		User user = new User(UUID.randomUUID().toString(), email, passwordEncoder.encode(password));
		userRepository.save(user);
		return jwtService.generateToken(user.getId());
	}

	@Override
	public String login(String email, String password) {
		Optional<User> maybeUser = userRepository.findByEmail(email);
		if (maybeUser.isEmpty() || !passwordEncoder.matches(password, maybeUser.get().getPasswordHash())) {
			throw new RuntimeException("Invalid email or password");
		}
		return jwtService.generateToken(maybeUser.get().getId());
	}
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd server && ./mvnw test -Dtest=AuthServiceTest`
Expected: PASS — `Tests run: 4, Failures: 0, Errors: 0`.

- [ ] **Step 9: Commit**

```bash
git add server/src/main/java/com/mtg_app/entity/User.java \
  server/src/main/java/com/mtg_app/dao/UserRepository.java \
  server/src/main/java/com/mtg_app/dto/RegisterRequest.java \
  server/src/main/java/com/mtg_app/dto/LoginRequest.java \
  server/src/main/java/com/mtg_app/dto/AuthResponse.java \
  server/src/main/java/com/mtg_app/service/AuthServiceInterface.java \
  server/src/main/java/com/mtg_app/service/AuthService.java \
  server/src/test/java/com/mtg_app/service/AuthServiceTest.java
git commit -m "server: add User entity, repository, and AuthService with register/login"
```

---

## Task S3: AuthController

**Files:**
- Create: `server/src/main/java/com/mtg_app/controllers/AuthController.java`
- Test: `server/src/test/java/com/mtg_app/controllers/AuthControllerTest.java`

**Interfaces:**
- Consumes: `AuthService.register/login` (Task S2), `RestExceptionHandler` (existing, `com.mtg_app.controllers`), `AuthResponse` (Task S2).
- Produces: `POST /api/v1/auth/register` and `POST /api/v1/auth/login`, each accepting a JSON body `{ email, password }` and returning `{ token }`.

- [ ] **Step 1: Write the failing test `AuthControllerTest.java`** (standalone MockMvc — no Spring context, no DB)

```java
package com.mtg_app.controllers;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.mtg_app.service.AuthService;

class AuthControllerTest {

	private AuthService authService;
	private MockMvc mockMvc;

	@BeforeEach
	void setup() {
		authService = mock(AuthService.class);
		mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
				.setControllerAdvice(new RestExceptionHandler())
				.build();
	}

	@Test
	void registerReturnsToken() throws Exception {
		when(authService.register(anyString(), anyString())).thenReturn("tok-1");

		mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@b.com\",\"password\":\"pw\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").value("tok-1"));
	}

	@Test
	void loginErrorBecomesBadRequestWithMessage() throws Exception {
		when(authService.login(anyString(), anyString()))
				.thenThrow(new RuntimeException("Invalid email or password"));

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@b.com\",\"password\":\"wrong\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Invalid email or password"));
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && ./mvnw test -Dtest=AuthControllerTest`
Expected: FAIL — compilation error, `cannot find symbol: class AuthController`.

- [ ] **Step 3: Implement `AuthController.java`**

```java
package com.mtg_app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mtg_app.dto.AuthResponse;
import com.mtg_app.dto.LoginRequest;
import com.mtg_app.dto.RegisterRequest;
import com.mtg_app.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	@Autowired
	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
		String token = authService.register(request.getEmail(), request.getPassword());
		return ResponseEntity.ok(new AuthResponse(token));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
		String token = authService.login(request.getEmail(), request.getPassword());
		return ResponseEntity.ok(new AuthResponse(token));
	}
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && ./mvnw test -Dtest=AuthControllerTest`
Expected: PASS — `Tests run: 2, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```bash
git add server/src/main/java/com/mtg_app/controllers/AuthController.java \
  server/src/test/java/com/mtg_app/controllers/AuthControllerTest.java
git commit -m "server: add AuthController with /register and /login endpoints"
```

---

## Task S4: SecurityConfig — symmetric JWT decoder, BCrypt, public auth path

**Files:**
- Modify: `server/src/main/java/com/mtg_app/security/SecurityConfig.java` (full rewrite)
- Test: `server/src/test/java/com/mtg_app/security/SecurityConfigTest.java`

**Interfaces:**
- Consumes: `JwtService` (Task S1) in the test only.
- Produces: `JwtDecoder jwtDecoder(String secret)` bean (validates HS256 tokens with the shared secret), `PasswordEncoder passwordEncoder()` bean (BCrypt), and a filter chain that permits `/api/v1/auth/**`.

- [ ] **Step 1: Write the failing test `SecurityConfigTest.java`**

```java
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && ./mvnw test -Dtest=SecurityConfigTest`
Expected: FAIL — compilation error, `cannot find symbol: method jwtDecoder(String)`.

- [ ] **Step 3: Rewrite `SecurityConfig.java`**

```java
package com.mtg_app.security;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		return http
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers("/api/v1/explore/**").permitAll()
						.requestMatchers("/api/v1/auth/**").permitAll()
						.requestMatchers("/api/v1/decks/**").authenticated()
						.anyRequest().authenticated())
				.cors(withDefaults())
				.oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()))
				.csrf(csrf -> csrf
						.ignoringRequestMatchers("/api/v1/explore/**", "/api/v1/auth/**"))
				.build();
	}

	@Bean
	public JwtDecoder jwtDecoder(@Value("${app.jwt.secret}") String secret) {
		SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
		return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && ./mvnw test -Dtest=SecurityConfigTest`
Expected: PASS — `Tests run: 2, Failures: 0, Errors: 0`.

- [ ] **Step 5: Verify the whole server compiles**

Run: `cd server && ./mvnw test-compile`
Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit**

```bash
git add server/src/main/java/com/mtg_app/security/SecurityConfig.java \
  server/src/test/java/com/mtg_app/security/SecurityConfigTest.java
git commit -m "server: validate self-issued JWTs with symmetric decoder; add BCrypt; open /api/v1/auth"
```

---

## Task C1: Client AuthApi

**Files:**
- Create: `client/src/api/authApi.tsx`
- Test: `client/src/api/__tests__/authApi.test.ts`

**Interfaces:**
- Produces: `class AuthApi` with `async register(email: string, password: string): Promise<string>` and `async login(email: string, password: string): Promise<string>`, each returning the JWT string from `{ token }`. On failure, throws `Error` with the server's `message` (from `AppErrorResponse`).

- [ ] **Step 1: Write the failing test `authApi.test.ts`**

```ts
import axios from "axios";
import { AuthApi } from "../authApi";

vi.mock("axios");

describe("AuthApi", () => {
  const api = new AuthApi();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register posts credentials and returns the token", async () => {
    (axios.post as any).mockResolvedValue({ data: { token: "tok-1" } });

    const token = await api.register("a@b.com", "pw");

    expect(token).toBe("tok-1");
    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", { email: "a@b.com", password: "pw" });
  });

  it("login posts credentials and returns the token", async () => {
    (axios.post as any).mockResolvedValue({ data: { token: "tok-2" } });

    const token = await api.login("a@b.com", "pw");

    expect(token).toBe("tok-2");
    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", { email: "a@b.com", password: "pw" });
  });

  it("login throws the server message on failure", async () => {
    (axios.post as any).mockRejectedValue({ response: { data: { message: "Invalid email or password" } } });

    await expect(api.login("a@b.com", "wrong")).rejects.toThrow("Invalid email or password");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/api/__tests__/authApi.test.ts`
Expected: FAIL — `Failed to resolve import "../authApi"`.

- [ ] **Step 3: Implement `authApi.tsx`**

```ts
import axios from "axios";

export class AuthApi {
  private base_url: string;

  constructor() {
    this.base_url = "/api/v1/auth";
  }

  async register(email: string, password: string): Promise<string> {
    try {
      const response: { data: { token: string } } = await axios.post(`${this.base_url}/register`, { email, password });
      return response.data.token;
    } catch (err) {
      throw new Error(extractError(err));
    }
  }

  async login(email: string, password: string): Promise<string> {
    try {
      const response: { data: { token: string } } = await axios.post(`${this.base_url}/login`, { email, password });
      return response.data.token;
    } catch (err) {
      throw new Error(extractError(err));
    }
  }
}

function extractError(err: unknown): string {
  const error = err as { response?: { data?: { message?: string }; statusText?: string } };
  return error.response?.data?.message || error.response?.statusText || "Something went wrong";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/api/__tests__/authApi.test.ts`
Expected: PASS — `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add client/src/api/authApi.tsx client/src/api/__tests__/authApi.test.ts
git commit -m "client: add AuthApi wrapper for register/login"
```

---

## Task C2: UserContextProvider — localStorage token + auth actions

**Files:**
- Modify: `client/src/components/user/UserContextProvider.tsx` (full rewrite)
- Test: `client/src/components/user/__tests__/UserContextProvider.test.tsx`
- (No change needed to `useUser.tsx` — it returns the context as-is.)

**Interfaces:**
- Consumes: `AuthApi` (Task C1).
- Produces: `UserContext` with shape `{ idToken: string; isAuthenticated: boolean; login: (email, password) => Promise<void>; register: (email, password) => Promise<void>; logout: () => void }`. Also exports a named helper `isTokenValid(token: string): boolean`. Token persisted under `localStorage["idToken"]`.

- [ ] **Step 1: Write the failing test `UserContextProvider.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserContextProvider from "../UserContextProvider";
import { useUser } from "../useUser";
import { AuthApi } from "@/api/authApi";

vi.mock("@/api/authApi");

function makeToken(expSeconds: number) {
  const payload = btoa(JSON.stringify({ sub: "u1", exp: expSeconds }));
  return `header.${payload}.sig`;
}

function Consumer() {
  const { isAuthenticated, idToken, login, logout } = useUser();
  return (
    <div>
      <p data-testid="auth">{isAuthenticated ? "yes" : "no"}</p>
      <p data-testid="token">{idToken}</p>
      <button onClick={() => login("a@b.com", "pw")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("UserContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts unauthenticated when no token is stored", () => {
    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>
    );
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
  });

  it("stores the token and becomes authenticated after login", async () => {
    const token = makeToken(Math.floor(Date.now() / 1000) + 3600);
    (AuthApi.prototype.login as any).mockResolvedValue(token);

    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>
    );
    fireEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("yes"));
    expect(localStorage.getItem("idToken")).toBe(token);
  });

  it("logout clears the token", async () => {
    const token = makeToken(Math.floor(Date.now() / 1000) + 3600);
    (AuthApi.prototype.login as any).mockResolvedValue(token);

    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>
    );
    fireEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByText("logout"));
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(localStorage.getItem("idToken")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/components/user/__tests__/UserContextProvider.test.tsx`
Expected: FAIL — the current provider has no `login`/`logout` and still depends on Auth0 (`useAuth0` throws without an `Auth0Provider`).

- [ ] **Step 3: Rewrite `UserContextProvider.tsx`**

```tsx
/**
 * Global state to keep the user's JWT and expose auth actions (local auth).
 */

import { createContext, useEffect, useState, type ReactNode } from "react";
import { AuthApi } from "@/api/authApi";

interface UserContextInterface {
  idToken: string;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface UserTokenProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "idToken";
const authApi = new AuthApi();

export function isTokenValid(token: string): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const UserContext = createContext<UserContextInterface>({
  idToken: "",
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export default function UserContextProvider({ children }: UserTokenProviderProps) {
  const [idToken, setIdToken] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && isTokenValid(stored)) {
      setIdToken(stored);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  async function login(email: string, password: string) {
    const token = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setIdToken(token);
  }

  async function register(email: string, password: string) {
    const token = await authApi.register(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setIdToken(token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setIdToken("");
  }

  const isAuthenticated = isTokenValid(idToken);

  return (
    <UserContext.Provider value={{ idToken, isAuthenticated, login, register, logout }}>{children}</UserContext.Provider>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/components/user/__tests__/UserContextProvider.test.tsx`
Expected: PASS — `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/user/UserContextProvider.tsx \
  client/src/components/user/__tests__/UserContextProvider.test.tsx
git commit -m "client: store JWT in localStorage and expose login/register/logout"
```

---

## Task C3: Login/Register pages, AuthWrapper redirect, and routes

**Files:**
- Create: `client/src/pages/LoginPage.tsx`
- Create: `client/src/pages/RegisterPage.tsx`
- Modify: `client/src/components/user/AuthWrapper.tsx`
- Modify: `client/src/App.tsx` (imports + two new routes)
- Test: `client/src/pages/__tests__/LoginPage.test.tsx`
- Test: `client/src/pages/__tests__/RegisterPage.test.tsx`
- Test: `client/src/components/user/__tests__/AuthWrapper.test.tsx`

**Interfaces:**
- Consumes: `useUser()` → `{ login, register, isAuthenticated }` (Task C2).
- Produces: default-exported `LoginPage` and `RegisterPage` components; `AuthWrapper` now renders `<Navigate to="/login" replace />` when unauthenticated; routes `/login` and `/register`.

- [ ] **Step 1: Write the failing test `LoginPage.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { useUser } from "@/components/user/useUser";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  NavLink: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/components/user/useUser");

describe("LoginPage", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ login: mockLogin });
  });

  it("submits email and password then navigates to /decks", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("a@b.com", "pw"));
    expect(mockNavigate).toHaveBeenCalledWith("/decks");
  });

  it("shows an error message when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(screen.getByText("Invalid email or password")).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/pages/__tests__/LoginPage.test.tsx`
Expected: FAIL — `Failed to resolve import "../LoginPage"`.

- [ ] **Step 3: Implement `LoginPage.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/components/user/useUser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useUser();
  const navigate = useNavigate();

  async function submitHandler(event: FormEvent) {
    event.preventDefault();
    try {
      await login(email, password);
      navigate("/decks");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submitHandler} className="w-72 sm:w-90 mx-auto mt-10">
      <div className="grid gap-4 py-4">
        {error && <p className="text-red-500 font-bold">{error}</p>}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit">Login</Button>
        <p className="text-sm text-center">
          No account?{" "}
          <NavLink to="/register" className="underline">
            Register
          </NavLink>
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/pages/__tests__/LoginPage.test.tsx`
Expected: PASS — `2 passed`.

- [ ] **Step 5: Write the failing test `RegisterPage.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../RegisterPage";
import { useUser } from "@/components/user/useUser";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  NavLink: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/components/user/useUser");

describe("RegisterPage", () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ register: mockRegister });
  });

  it("submits email and password then navigates to /decks", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith("a@b.com", "pw"));
    expect(mockNavigate).toHaveBeenCalledWith("/decks");
  });

  it("shows an error message when registration fails", async () => {
    mockRegister.mockRejectedValue(new Error("An account with this email already exists"));
    render(<RegisterPage />);

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(screen.getByText("An account with this email already exists")).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `cd client && npx vitest run src/pages/__tests__/RegisterPage.test.tsx`
Expected: FAIL — `Failed to resolve import "../RegisterPage"`.

- [ ] **Step 7: Implement `RegisterPage.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/components/user/useUser";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useUser();
  const navigate = useNavigate();

  async function submitHandler(event: FormEvent) {
    event.preventDefault();
    try {
      await register(email, password);
      navigate("/decks");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submitHandler} className="w-72 sm:w-90 mx-auto mt-10">
      <div className="grid gap-4 py-4">
        {error && <p className="text-red-500 font-bold">{error}</p>}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit">Register</Button>
        <p className="text-sm text-center">
          Already have an account?{" "}
          <NavLink to="/login" className="underline">
            Login
          </NavLink>
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd client && npx vitest run src/pages/__tests__/RegisterPage.test.tsx`
Expected: PASS — `2 passed`.

- [ ] **Step 9: Write the failing test `AuthWrapper.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import AuthWrapper from "../AuthWrapper";
import { useUser } from "../useUser";

vi.mock("../useUser");
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }: any) => <div>redirect to {to}</div>,
}));

describe("AuthWrapper", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders children when authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: true });
    render(
      <AuthWrapper>
        <p>secret</p>
      </AuthWrapper>
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: false });
    render(
      <AuthWrapper>
        <p>secret</p>
      </AuthWrapper>
    );
    expect(screen.getByText("redirect to /login")).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `cd client && npx vitest run src/components/user/__tests__/AuthWrapper.test.tsx`
Expected: FAIL — the current `AuthWrapper` renders `ErrorMessage`, not a redirect; `redirect to /login` is not found.

- [ ] **Step 11: Rewrite `AuthWrapper.tsx`**

```tsx
/**
 * Wrapper that gates protected routes. Redirects to /login when unauthenticated.
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "./useUser";

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 12: Run the AuthWrapper test to verify it passes**

Run: `cd client && npx vitest run src/components/user/__tests__/AuthWrapper.test.tsx`
Expected: PASS — `2 passed`.

- [ ] **Step 13: Register the new routes in `App.tsx`**

Add these imports after the existing `import CardsByTheme ...` line:

```tsx
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
```

Then add these two route objects inside the `children` array (e.g. immediately after the `{ index: true, element: <HomePage /> },` line):

```tsx
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
```

- [ ] **Step 14: Type-check the client**

Run: `cd client && npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 15: Commit**

```bash
git add client/src/pages/LoginPage.tsx client/src/pages/RegisterPage.tsx \
  client/src/components/user/AuthWrapper.tsx client/src/App.tsx \
  client/src/pages/__tests__/LoginPage.test.tsx \
  client/src/pages/__tests__/RegisterPage.test.tsx \
  client/src/components/user/__tests__/AuthWrapper.test.tsx
git commit -m "client: add Login/Register pages, redirect AuthWrapper, wire routes"
```

---

## Task C4: Navbar — use local auth

**Files:**
- Modify: `client/src/components/ui/Navbar.tsx`
- Test: `client/src/components/ui/__tests__/Navbar.test.tsx`

**Interfaces:**
- Consumes: `useUser()` → `{ isAuthenticated, logout }` (Task C2).
- Produces: Navbar showing a `Login` link (`NavLink` to `/login`) when unauthenticated; a generic user-icon menu with `Sign out` (calls `logout()` then navigates to `/`) when authenticated.

> **Note (deviation from spec):** the spec mentioned an email-initial avatar. Because the JWT carries only the user id (`sub`) and no email, the Navbar uses a generic `UserCircleIcon` instead of an email initial. Surfacing the email would require an extra token claim for negligible benefit (YAGNI).

- [ ] **Step 1: Write the failing test `Navbar.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";
import { useUser } from "@/components/user/useUser";

vi.mock("@/components/user/useUser");
vi.mock("react-router-dom", () => ({
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

describe("Navbar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a Login link when the user is not authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: false, logout: vi.fn() });
    render(<Navbar />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/components/ui/__tests__/Navbar.test.tsx`
Expected: FAIL — current Navbar calls `useAuth0()`, which is now mocked away as `useUser`; the render throws or `Login` is not found as a plain link.

- [ ] **Step 3: Update `Navbar.tsx`**

Replace the import on line 1:

```tsx
import { useAuth0 } from "@auth0/auth0-react";
```

with:

```tsx
import { useUser } from "../user/useUser";
```

Change the icon import (line 3) to add `UserCircleIcon`:

```tsx
import { Bars3Icon, XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";
```

Change the `NavLink` import (line 4) to also import `useNavigate`:

```tsx
import { NavLink, useNavigate } from "react-router-dom";
```

Replace the auth hook + loading guard + handlers (the block starting `const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();` through the end of `logoutHandler`):

```tsx
  /** Auth details */
  const { isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  /** FUNCTIONS */
  function logoutHandler() {
    logout();
    navigate("/");
  }
```

Replace the profile-image `MenuButton` content — change:

```tsx
                    <img alt="" src={user?.picture} className="size-8 rounded-full" />
```

to:

```tsx
                    <UserCircleIcon aria-hidden="true" className="size-8 rounded-full text-gray-300" />
```

Replace the unauthenticated `Login` element — change:

```tsx
              <p className="text-neutral-300 hover:cursor-pointer" onClick={loginHandler}>
                Login
              </p>
```

to:

```tsx
              <NavLink to="/login" className="text-neutral-300 hover:cursor-pointer">
                Login
              </NavLink>
```

(The `Sign out` `MenuItem` already calls `onClick={logoutHandler}` — no change needed there.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/components/ui/__tests__/Navbar.test.tsx`
Expected: PASS — `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ui/Navbar.tsx client/src/components/ui/__tests__/Navbar.test.tsx
git commit -m "client: switch Navbar to local auth (login link, generic avatar, logout)"
```

---

## Task C5: Remove Auth0 provider, dependency, and env vars

**Files:**
- Modify: `client/src/main.tsx`
- Modify: `client/package.json` (remove `@auth0/auth0-react`)
- Modify: `client/.env`

**Interfaces:**
- Consumes: nothing new. This task removes the last Auth0 references now that no component imports `@auth0/auth0-react`.

- [ ] **Step 1: Rewrite `main.tsx` to drop `Auth0Provider`**

```tsx
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.tsx";
import UserContextProvider from "./components/user/UserContextProvider.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <UserContextProvider>
      <App />
      <Toaster />
    </UserContextProvider>
  </QueryClientProvider>
);
```

- [ ] **Step 2: Clear the Auth0 env vars in `client/.env`**

Replace the entire contents of `client/.env` with a single comment (the file previously held only `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENTID`):

```
# Local auth: no client-side auth env vars required.
```

- [ ] **Step 3: Uninstall the Auth0 package**

Run: `cd client && npm uninstall @auth0/auth0-react`
Expected: `@auth0/auth0-react` removed from `package.json` dependencies; `npm` updates the lockfile.

- [ ] **Step 4: Verify no Auth0 references remain**

Run: `cd client && grep -rn "auth0" src && echo "FOUND" || echo "CLEAN"`
Expected: `CLEAN` (grep finds nothing, so the `||` branch prints `CLEAN`).

- [ ] **Step 5: Run the full client gate (lint, build, tests)**

Run: `cd client && npm run lint && npm run build && npm run test`
Expected: ESLint passes; `tsc -b && vite build` succeeds; Vitest reports all suites passing (including the pre-existing `DeckList` tests).

- [ ] **Step 6: Commit**

```bash
git add client/src/main.tsx client/package.json client/package-lock.json client/.env
git commit -m "client: remove Auth0 provider, dependency, and env vars"
```

---

## Manual end-to-end verification (after all tasks)

Run the full stack and confirm the real flow. From the repo root:

1. Set a strong `app.jwt.secret` in `server/src/main/resources/secrets.properties` (≥ 32 bytes).
2. `docker compose up --build` (brings up `database`, `server`, `client`).
3. Visit the client, go to `/register`, create an account → you should be redirected to `/decks` and stay logged in on refresh.
4. `logout` from the Navbar → visiting `/decks` should redirect to `/login`.
5. `/login` with the same credentials → back to `/decks`.
6. Create a deck → confirm it persists and reloads (proves the Bearer token is accepted by `DeckController` and `userId` = the JWT `sub`).
7. `/login` with a wrong password → the form shows "Invalid email or password".

## Optional data cleanup

Existing `magic_deck` rows carry Auth0 `sub` ids and are now unreachable (new accounts get fresh UUIDs). This is acceptable per the design (wipe). To remove the orphans, connect via pgAdmin (port 7002) and run `TRUNCATE magic_deck CASCADE;`. The new `users` table is created automatically by Hibernate `ddl-auto=update` on first boot. This step is optional and not required for the feature to work.
