# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Magic: The Gathering deck-building app. A user authenticates via Auth0, builds/imports Commander decks, and browses ("explores") community deck data. The repo is a two-part monorepo with no root package manager:

- `client/` — React 19 + TypeScript + Vite SPA
- `server/` — Spring Boot 3.4 (Java 21) REST API backed by PostgreSQL

## Commands

### Client (`cd client`)
- `npm run dev` — Vite dev server (HTTPS via `localhost.pem`; proxies `/api` → `http://server:8080`)
- `npm run build` — type-check (`tsc -b`) then Vite build
- `npm run lint` — ESLint (CI runs this; must pass)
- `npm run test` — Vitest with coverage (CI runs this)
- `npm run test:no-coverage` — Vitest without coverage
- `npm run test:ui` — Vitest UI
- Run a single test file: `npx vitest run src/components/decks/__tests__/DeckList.test.tsx`
- Run tests matching a name: `npx vitest run -t "renders empty state"`

### Server (`cd server`)
- `./mvnw spring-boot:run` — run the API (port 8080)
- `./mvnw test` — run tests
- Run a single test: `./mvnw test -Dtest=MtgAppApplicationTests`
- `./mvnw clean package` — build the jar

### Full stack (Docker)
- `docker compose up --build` from repo root brings up `database` (Postgres), `server` (7001→8080), `client` (7000→5173), and `pgadmin` (7002). Both app containers hot-reload from mounted `src/`. Note the client dev-server proxy targets host `server`, so the app expects to run under Docker Compose (or a matching `server` host alias), not a bare `npm run dev` on the host.

## CI

`.github/workflows/client.yaml` runs on push/PR to `main` — three parallel jobs against `client/`: build, lint, unit tests. There is **no CI for the server**.

## Architecture

### Request flow
The client talks to two kinds of backends via thin class-based API wrappers in `client/src/api/`:

1. **Own backend** (`/api/v1/...`, proxied to Spring Boot):
   - `BackendDeckApi` → `/api/v1/decks` (authenticated; all deck CRUD, imports, stats, downloads)
   - `BackendExploreAPI` → `/api/v1/explore` (public)
2. **Third-party APIs called directly from the browser**:
   - `ScryfallApi` (`scryfallApi.tsx`) → api.scryfall.com for card data, autocomplete, printings, rulings
   - `EdhRecApi` (`edhRecApi.tsx`) → json.edhrec.com for commander/theme recommendations

The server **also** calls Scryfall itself (`server/.../tools/ScryfallApi.java`) — card data is fetched client-side when building, but the server re-queries Scryfall to persist authoritative card records during imports and explore batch lookups.

### Card persistence pattern (server)
Cards are deduplicated globally. `MagicCardService.getOrCreateNewCard(...)` and `batchCheckIfCardsExist(...)` ensure a `MagicCard` row exists (keyed by TCGplayer id) before it's linked to a deck. Decks reference cards through join entities — do not duplicate card rows per deck:
- `MagicDeck` — a user's deck (owns `deckImageUri`, `commander` list, `colorIdentity`, `theme`)
- `MagicDeckCard` — join row: card ↔ deck + `quantity` + `commander` flag
- `MagicToken` / `MagicDeckCardToken` — tokens a deck's cards produce, tracked separately so they follow the card that creates them (see `updateCardPrinting` / `removeCardFromDeck` in `DeckController`, which keep the token mappings in sync)

Each controller endpoint corresponds 1:1 to a method on `BackendDeckApi`; when adding an endpoint, update both sides and the shared DTO/interface shapes (`server/.../dto/` and `client/src/api/interfaces.ts`).

### Auth
- Auth0 is configured in `client/src/main.tsx` (`Auth0Provider`) with env vars `VITE_AUTH0_DOMAIN` / `VITE_AUTH0_CLIENTID` (in `client/.env`).
- `UserContextProvider` fetches the Auth0 id token (`getAccessTokenSilently({ detailedResponse: true })`) and exposes `{ idToken, isAuthenticated }` via the `useUser()` hook. Every `BackendDeckApi` call takes `idToken` and sends it as `Authorization: Bearer`.
- `AuthWrapper` gates protected routes in the client; server-side, `SecurityConfig` validates the JWT as an OAuth2 resource server — `/api/v1/explore/**` is public, `/api/v1/decks/**` (and everything else) requires auth. The server derives `userId` from `jwt.getSubject()`, never from the request body.

### Server error handling
`RestExceptionHandler` (`@ControllerAdvice`) catches all exceptions and returns HTTP 400 with an `AppErrorResponse` (`status`, `message`, `timeStamp`). Controllers throw plain `RuntimeException` for not-found/ownership failures rather than returning specific status codes.

### Client state & routing
- Server/remote data is fetched with **TanStack React Query** — feature-local query hooks live beside their components (`useDeckQuery`, `useStatsQuery`, `useExploreQuery`, `useExploreQuery` etc.). Prefer these hooks over calling the API classes directly from components.
- Routing is React Router v7 (`createBrowserRouter` in `App.tsx`); `RootLayout` renders `Navbar` + `<Outlet />`. Routes: `/decks`, `/decks/new-deck`, `/decks/:deckId`, and nested `/explore/*`.
- UI is Tailwind CSS v4 + shadcn/ui (new-york style, components in `src/components/ui/`, configured in `components.json`). The `@` alias maps to `client/src`.

## Conventions
- Client formatting: Prettier with `printWidth: 133`, `tabWidth: 2` (`client/.prettierrc`).
- ESLint ignores test dirs (`__tests__`), `dist`, and `coverage` — lint failures there won't surface in CI, but tests still run.
- Tests are colocated in `__tests__/` folders next to source; setup in `client/src/test/setup.ts` (jsdom + jest-dom).
- Server secrets (DB creds, Okta/Auth0 issuer & audience) live in `server/src/main/resources/secrets.properties`, imported optionally by `application.properties`. Hibernate `ddl-auto=update` auto-migrates the schema — there are no migration files.
