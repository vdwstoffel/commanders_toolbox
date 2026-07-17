# Design: Add-card dialog revamp

Date: 2026-07-17
Status: Approved (pending spec review)

## Goal

Revamp the "add a card to a deck" flow on the deck page. Today the flow is split
and thin: a search box, a separate "Add card" button, and a card-detail overlay
(`FullCardInfo`) that has no add action of its own. There is no quantity input and
no printing picker at add time (both require finding the card in the deck list
afterward), Scryfall data is re-fetched uncached on every open, and there are a
couple of real bugs (double/contradictory toast, no button loading state, duplicate
token rows on the server).

This replaces that with a single **AddCardDialog**: a two-column card view with a
sticky bottom action bar carrying an "in deck" count, a printing picker, a quantity
stepper, and a prominent gold "Add to Deck" CTA. Scryfall reads become cached React
Query hooks, and the backend gains a quantity parameter, a transaction boundary, and
token-row dedup.

## Decisions (from brainstorming)

- **Scope:** full package — redesigned dialog + quantity stepper + printing picker,
  Scryfall React Query caching, the bug fixes, and the backend changes to support it.
- **Layout:** Option A — two-column details + sticky bottom action bar.
- **Target flow:** the deck-building add flow (`DeckDetails`). `AddCardDialog` is built
  reusable so the explore overlay (`InfoAndCreateOverlay`) could adopt it later, but
  wiring explore is **out of scope**.
- **Out of scope:** server-side Scryfall re-fetch / trust-boundary hardening; the
  `batchCheckIfCardsExist`-by-name issue.

## Current state (reference)

- `client/src/pages/DeckDetails.tsx` — holds `cardToSearch` state (~L44), the add
  handler (~L92-113) with color-identity + commander validation, the search box
  (~L246), a separate "Add card" `Button` (~L249), and the `FullCardInfo` overlay
  (~L252-256).
- `client/src/components/decks/CardSearchWithAutoComplete.tsx` — search + autocomplete;
  on select calls `scryfallApi.getCardByName(name)` and passes the full card up via a
  `setValue` prop.
- `client/src/components/decks/useDeckQuery.tsx` — `useAddCardToDeck()` (~L70-85):
  `mutationFn` → `deckApi.addCardToDeck(deckId, cardData, idToken)`, `onSuccess` toasts
  `"Card added to deck"` + invalidates `["deckById"]`, `onError` toasts. `useGetDeckById()`
  supplies the current deck's cards. `useUpdateCardQuantity()` caps quantity at 99.
- `client/src/api/backendDeckApi.tsx` — `addCardToDeck(deckId, card, idToken)` POSTs the
  full `MagicCard` to `/{deckId}/add-card`.
- `client/src/api/scryfallApi.tsx` — `cardAutocomplete`, `getCardByName`, `getCardByTcgId`,
  `getCardRulings`, `getAllPrintings(oracleId)`. No caching.
- `client/src/components/cards/FullCardInfo.tsx` — dispatches by layout
  (single/DFC/adventure/meld) and renders image, prices (`EUR: … / USD: …`), oracle,
  and `<Rulings>`; `CardInfoContainer.tsx` is the image+info layout; `Ruling.tsx` fetches
  rulings on every mount.
- Server `DeckController.addCardToDeck` (~L177-190): `@AuthenticationPrincipal Jwt jwt`,
  ownership check via `getDeckByDeckIdAndUserId`, calls `addCardToDeck(deck, cardRequest, 1)`
  (quantity hardcoded to 1).
- `MagicDeckService.addCardToDeck(deck, card, quantity)` (~L115-137): `getOrCreateNewCard`
  → `createOrUpdateDeckCardMapping` (increments quantity if the card already in deck) →
  inserts `MagicDeckCardToken` rows for token-makers. Not `@Transactional` at this level.
- `MagicDeckCardTokenService.createDeckCardTokenMapping` — `save`s with no dedup.

## Frontend design

### AddCardDialog (new) — `client/src/components/decks/AddCardDialog.tsx`
Rendered inside the existing `OverlayWrapper` when a card is selected from search.
Owns local state: `selectedPrinting` (a `MagicCard`, defaults to the searched card) and
`quantity` (default 1). Composition:
- **Card view** reuses the existing layout dispatcher `FullCardInfo` (so DFC / adventure /
  meld rendering is not rebuilt) for art + name (Cinzel) + type + oracle + rulings, with:
  - mana-cost pips rendered from the card's mana symbols,
  - price chips `€ {eur} / $ {usd}` (styled, replacing the plain `EUR: …` lines),
  - **Rulings** made collapsible (lazy — fetched only when expanded).
- **Sticky bottom action bar** (`bg-card`/`border-border`, gold CTA):
  - left: `In deck: ×{count}` (0 hidden or shown as "Not in deck") + **Printing** dropdown;
  - right: **quantity stepper** (`−  n  +`, min 1, max 99) + **Add to Deck** button
    (`variant` default = gold primary; disabled + spinner while the mutation is pending).
- **Validation** (moved out of `DeckDetails` into the dialog, shown inline, not as a toast):
  block add when a card color is outside `deckColorIdentity`, or when the card name is a
  commander. Message rendered with `text-destructive`.
- **On add:** call the mutation with the selected printing + quantity; on success the bar
  reflects the new `In deck` count and the dialog stays open (batch-add friendly).

`DeckDetails` shrinks to: render the search box; on select, open `AddCardDialog` with the
chosen card. The separate "Add card" button, the ad-hoc handler, and the `cardToSearch`
prop chain are removed.

### Scryfall React Query hooks — `client/src/hooks/` (beside existing `useExploreQuery`)
Wrap the immutable Scryfall reads so repeated opens hit cache:
- `useCardQuery(name)` → `scryfallApi.getCardByName(name)`
- `useCardByTcgIdQuery(tcgId)` → `scryfallApi.getCardByTcgId(tcgId)`
- `usePrintingsQuery(oracleId)` → `scryfallApi.getAllPrintings(oracleId)`
- `useCardRulingsQuery(rulingsUri, enabled)` → `scryfallApi.getCardRulings(rulingsUri)`
  (`enabled` gates the fetch until the rulings section is expanded).

All use a long `staleTime` (card data doesn't change) and a stable `queryKey`. Existing
components that call these Scryfall methods directly (`FullCardInfo`, `Ruling`,
`ShowUniquePrintings`, `CardSearchWithAutoComplete`) migrate to the hooks where it does
not expand scope; the autocomplete keystroke call may stay direct (it is inherently
per-keystroke) but should be debounced-as-is (no behavior change required).

### Backend API wrapper — `client/src/api/backendDeckApi.tsx`
`addCardToDeck(deckId, card, idToken, quantity = 1)` sends `quantity` (query param or body
field per the server contract below). Default 1 keeps existing callers working.

### Bug fixes
- **Single toast source:** remove the premature/duplicate `toast.success(...)` in
  `DeckDetails`; keep only `useAddCardToDeck`'s `onSuccess`/`onError`. The success toast
  names the card + quantity (e.g. `Added ×2 Miirym, Sentinel Wyrm`).
- **Loading state:** the Add button consumes `addingCard` (isPending) → disabled + spinner,
  preventing double-submits.

## Backend design

### Endpoint — `DeckController.addCardToDeck`
Accept an optional quantity, default 1: `@RequestParam(defaultValue = "1") int quantity`,
passed through to `magicDeckService.addCardToDeck(deck, cardRequest, quantity)`. Clamp to
a sane range (1–99) to mirror the client cap; reject `<1` via a `RuntimeException`
("Quantity must be at least 1"). Ownership check and JWT-subject derivation unchanged.

### Transaction boundary — `MagicDeckService.addCardToDeck`
Annotate the method `@Transactional` so card persistence, the deck-card mapping, and token
mapping commit atomically (a failing token fetch no longer leaves a card without tokens).

### Token dedup — `MagicDeckCardTokenService`
Add a get-or-create: before inserting a `MagicDeckCardToken`, check for an existing row by
`(deckId, cardId, tokenId)` and skip if present. Add the matching finder to
`MagicDeckCardTokenRepository`. This stops duplicate token-mapping rows accumulating when a
token-maker is added more than once.

## Data flow

Search → select card → `AddCardDialog` opens (card via `useCardQuery`, printings via
`usePrintingsQuery`) → user picks printing + quantity → **Add to Deck** →
`useAddCardToDeck` → `POST /{deckId}/add-card?quantity=N` with the selected printing →
server (transactional): `getOrCreateNewCard` → increment-or-create deck-card mapping →
get-or-create token mappings → 200 → client invalidates `["deckById"]`, single toast,
bar updates the `In deck` count.

## Error handling

- Off-color-identity / commander adds are blocked inline in the dialog before any request.
- Server failures (bad deck/ownership, quantity < 1) surface via the existing
  `RestExceptionHandler` (HTTP 400 + `AppErrorResponse`); the client shows the message via
  the single error toast.
- Scryfall query failures render an inline error state in the dialog (via the query hooks'
  error state) rather than leaving a blank panel.

## Testing

- **Server** (`./mvnw test -Dtest=...`, pure unit tests like the existing suite):
  - `addCardToDeck` adds `quantity` on first add and increments on repeat.
  - Adding the same token-maker twice creates exactly one `MagicDeckCardToken` per token
    (dedup), not duplicates.
  - `quantity < 1` is rejected.
- **Client** (Vitest, globals enabled, colocated `__tests__`):
  - `AddCardDialog`: renders card name/type/price chips/mana pips; stepper changes quantity
    (clamped 1–99); **Add** calls the mutation with the selected printing's id + quantity;
    off-identity and commander adds are blocked with an inline `text-destructive` message and
    no mutation call; exactly one toast on success.
  - Scryfall query hooks: return data and cache by key (a second mount does not refetch).
  - Preserve the existing 98-test suite; gate on `npm run lint && npm run build && npm run test`.

## Out of scope (YAGNI)

- Wiring the explore (`InfoAndCreateOverlay`) flow to the new dialog.
- Server-side Scryfall re-fetch / validating client-sent card fields.
- Fixing `batchCheckIfCardsExist` (by-name) — unrelated import path.
- Persisting prices server-side / price history.
- Bulk/paste add, deck-wide quantity editing changes (the deck-list quantity/printing
  editors stay as they are).
