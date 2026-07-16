# Design: Replace Auth0 with local email/password authentication

Date: 2026-07-16
Status: Approved (pending spec review)

## Goal

Remove the dependency on Auth0/Okta so the MTG deck app runs fully self-contained
(Docker Compose, no external identity provider). Replace it with email/password
authentication where the Spring Boot server both **issues** and **validates** its
own JWTs.

## Key decisions

- **Approach:** Build auth into the existing Spring Boot server. No extra container
  (no Keycloak).
- **Identifier:** Email + password. Passwords hashed with BCrypt.
- **Registration:** Open self-registration.
- **Tokens:** A single long-lived JWT (HS256, symmetric HMAC secret), 7-day TTL,
  with the user id in the `sub` claim. No refresh tokens.
- **Contract preserved:** The server keeps reading the user id from `jwt.getSubject()`,
  so `DeckController` is unchanged.
- **Existing data:** Existing decks (tied to Auth0 `sub` ids) are wiped. No migration.

## Server components

### New

- **`User` entity + `UserRepository`**
  - Table columns: `id` (UUID string, becomes the JWT `sub`), `email` (unique, not null),
    `passwordHash` (not null).
  - This is the first real user table. `MagicDeck.userId` remains a `String` referenced
    by convention (no foreign-key/schema change to `MagicDeck`).
- **`AuthController`** — base path `/api/v1/auth`, public (no auth required):
  - `POST /register` — validate email not already used, hash password, save `User`,
    return `AuthResponse { token }`.
  - `POST /login` — look up by email, verify password against hash, return
    `AuthResponse { token }`.
- **`JwtService`** — issues HS256 JWTs via `NimbusJwtEncoder`:
  - Claims: `sub` = user id, `iat`, `exp` = now + TTL. Issuer is the app itself.
  - Uses the same symmetric secret that drives the decoder.
- **DTOs** (in `server/.../dto/`): `RegisterRequest { email, password }`,
  `LoginRequest { email, password }`, `AuthResponse { token }`.

### Changed

- **`SecurityConfig`**
  - Add `/api/v1/auth/**` to `permitAll` (alongside existing public `/api/v1/explore/**`).
  - Replace the Okta starter's auto-configured JWT decoder with an explicit
    `JwtDecoder` bean built from the symmetric secret (`NimbusJwtDecoder` with
    `MacAlgorithm.HS256`).
  - Add a `NimbusJwtEncoder` bean (symmetric secret) for `JwtService`.
  - Add a `PasswordEncoder` bean (`BCryptPasswordEncoder`).
  - Keep the existing CORS/CSRF setup; add `/api/v1/auth/**` to CSRF-ignored paths
    (stateless JSON endpoints).
- **`pom.xml`**
  - Remove `com.okta.spring:okta-spring-boot-starter`.
  - Add `spring-boot-starter-security` and `spring-boot-starter-oauth2-resource-server`
    (both bring the Nimbus JOSE support used for encode + decode).
- **`secrets.properties` / `application.properties`**
  - Remove `okta.oauth2.issuer` and `okta.oauth2.audience`.
  - Add `app.jwt.secret` (HMAC key, >= 32 bytes for HS256) and `app.jwt.ttl` (e.g. `7d`
    or seconds).

## Client components

### New

- **`AuthApi`** (`client/src/api/authApi.tsx`) — thin wrapper: `register(email, password)`
  and `login(email, password)` calling `/api/v1/auth/register` and `/api/v1/auth/login`,
  returning the token.
- **`Login` and `Register` pages** — shadcn/ui form components; routes `/login` and
  `/register`. On success, store token and redirect to `/decks`.

### Changed

- **`UserContextProvider`** — remove `useAuth0`. Instead:
  - Read the token from `localStorage` on mount.
  - Expose `{ idToken, isAuthenticated, login, register, logout }`.
  - `isAuthenticated` = a token is present and not expired.
  - `login`/`register` call `AuthApi`, persist the token to `localStorage`, update state.
  - `logout` clears `localStorage` and state.
- **`useUser()`** — surface the new context shape (token + auth actions).
- **`Navbar`** — remove `useAuth0`, `loginWithRedirect`, `logout(...)`, and `user.picture`.
  Show a "Login" link when logged out; when logged in, show an avatar derived from the
  email initial and a logout button.
- **`AuthWrapper`** — same gating logic; redirect to `/login` when unauthenticated
  instead of only showing a message.
- **`main.tsx`** — remove `Auth0Provider` wrapper.
- **`.env`** — remove `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENTID`.
- **`package.json`** — remove `@auth0/auth0-react`.

### Unchanged

- All 16 `BackendDeckApi` methods still send `Authorization: Bearer ${idToken}` — no change.

## Data flow

1. User registers or logs in via the Login/Register page.
2. Server validates, issues an HS256 JWT with the user id in `sub`, returns it.
3. Client stores the token in `localStorage`; `useUser()` exposes it.
4. Every `BackendDeckApi` call sends it as `Authorization: Bearer <token>`.
5. Server's `JwtDecoder` validates signature + expiry; `jwt.getSubject()` yields the
   user id.
6. Deck ownership checks in `DeckController` work exactly as before.

## Error handling

- Duplicate email on register / bad credentials on login → server throws a
  `RuntimeException`, caught by the existing `RestExceptionHandler` → HTTP 400 +
  `AppErrorResponse { status, message, timeStamp }`. The client renders `message` on
  the form.
- Expired or invalid token → OAuth2 resource server returns 401. Client clears
  `localStorage` and routes to `/login`.

## Testing

- **Server** (`./mvnw test`):
  - `JwtService`: issue → decode round-trip, subject correctness, expiry.
  - `AuthController`: successful register, duplicate-email rejection, successful login,
    wrong-password rejection.
- **Client** (`npm run test` / `lint` / `build`, per CI):
  - `UserContextProvider`: token persisted to/read from `localStorage`;
    `isAuthenticated` reflects presence/expiry.
  - `Login` / `Register`: submit calls `AuthApi`; error message rendered on failure.

## Out of scope (YAGNI)

- Refresh tokens, password reset, email verification, roles/permissions,
  social login, and any migration of existing Auth0-owned decks.
