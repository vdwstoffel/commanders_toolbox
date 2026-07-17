# Card Detail Dialog — Design

## Problem

Clicking a card that is already in a deck (deck detail page, via `CompactCardInfo`) opens a
modal that looks unpolished compared to the recently reworked `AddCardDialog`:

- It uses Info / Printings **tabs** instead of one cohesive view.
- The Info tab (`FullCardInfo`) shows prices as plain text and a **right-aligned, floating
  "Rules" block** with awkward spacing and large empty areas.
- The Printings tab (`ShowUniquePrintings`) uses a **carousel** rather than the compact
  thumbnail row used by `AddCardDialog`.

## Goal

Make the click-a-card-in-deck modal visually consistent with `AddCardDialog` by unifying it
into a single scrolling view, while exposing the deck-specific controls the card needs
(change printing, edit quantity, remove from deck).

## Approach

Add a new component `client/src/components/decks/CardDetailDialog.tsx`, modeled directly on
`AddCardDialog.tsx` so the two dialogs share the same visual language. `CompactCardInfo`
renders it inside the existing `OverlayWrapper`, replacing the current
`Tabs` + `FullCardInfo` + `ShowUniquePrintings` block.

### Data

- Fetch the full Scryfall card by name with `useCardQuery(cardName)` (same source
  `FullCardInfo` uses today) to obtain `oracle_id`, `prices`, `mana_cost`, `rulings_uri`, and
  the CardFaceView data.
- Fetch printings with `usePrintingsQuery(oracle_id)`.
- Resolve a chosen printing via `useCardByTcgIdQuery` (same hooks `AddCardDialog` uses).
- While the Scryfall card is loading, show `<Loader />`; on error show `<ErrorMessage />`.

### Layout (single view, top → bottom)

1. `CardFaceView` — card image.
2. Mana cost (`ManaCost`) + € / $ price pills — the styled badges from `AddCardDialog`.
3. Collapsible **Rulings** (`▸ / ▾`) using `Rulings`, replacing the floating Rules block.
4. **Printing picker** — the horizontal thumbnail row from `AddCardDialog`
   (`usePrintingsQuery`), replacing the carousel. The card's **current** printing is
   pre-selected/highlighted. Clicking a *different* printing calls `updateCardPrinting` and
   closes the modal (preserves current behavior).
5. **Action row** (`border-t`, matching `AddCardDialog`):
   - Left: an `In deck: ×N` indicator plus **quantity −/+** controls that call
     `updateCardQty`.
   - Right: a **Remove from deck** button that calls `removeCard` and closes the modal.

### Deck-specific rules

- **Commander** cards: quantity is locked (no −/+ effect) and the Remove button is hidden —
  mirroring the existing `cardDetails.commander` guards in `CompactCardInfo`
  (`handleExitInput` early-returns for commanders; the delete icon is hidden for them).
- The current printing is identified by `cardDetails.card.id` (the TCGplayer id the backend
  keys cards on), matched against each printing's `tcgplayer_id`.

### Hooks reused (no new API work)

- `useUpdateCardPrinting`, `useUpdateCardQuantity`, `useRemoveCardFromDeck`
  (already used by `CompactCardInfo`).
- `useCardQuery`, `usePrintingsQuery`, `useCardByTcgIdQuery`
  (already used by `FullCardInfo` / `AddCardDialog`).

No server, DTO, or API-interface changes are required.

## What changes

- **New:** `client/src/components/decks/CardDetailDialog.tsx`.
- **Edit:** `client/src/components/decks/CompactCardInfo.tsx` — replace the tabbed modal body
  with `<CardDetailDialog … onClose={toggleShowCardInfoHandler} />`; remove now-unused local
  state (`activeTab`, `cardPrinting`, the printing-sync `useEffect`) and imports (`Tabs`,
  `FullCardInfo`, `ShowUniquePrintings`). Keep the compact-row quantity double-click editing
  and delete icon as-is (the modal adds a second path to those actions, it does not remove
  the row controls).

## What does NOT change (no deletions)

`FullCardInfo`, `ShowUniquePrintings`, and `CustomTabs` all remain — each is still used
elsewhere:

- `FullCardInfo` → `LandCycles`, `explore/InfoAndCreateOverlay`.
- `ShowUniquePrintings` → `NewDeckForm`.
- `CustomTabs` → `CardRecomendations`.

## Testing

- Colocated test `client/src/components/decks/__tests__/CardDetailDialog.test.tsx`:
  - Renders card face, price pills, and printing thumbnails for a mocked card + printings.
  - Selecting a different printing thumbnail calls `updateCardPrinting` and `onClose`.
  - −/+ updates quantity via `updateCardQty`; Remove calls `removeCard` and `onClose`.
  - Commander card: quantity controls have no effect and the Remove button is absent.
- Existing `CompactCardInfo` tests still pass (adjust selectors if they asserted on the old
  tab structure).
- `npm run lint` and `npm run test` pass.

## Out of scope

- No changes to `AddCardDialog`, the server, DTOs, or API interfaces.
- No redesign of `OverlayWrapper` or the compact card row itself.
