# Design: Artwork picker in AddCardDialog

Date: 2026-07-17
Status: Approved (pending spec review)

## Goal

Two coupled issues in the just-shipped `AddCardDialog` (deck-page add-card flow):

1. **Bug:** clicking the printing/set `Select`'s down-arrow closes the whole modal.
   Cause — the shadcn `Select` renders its dropdown in a React **portal** on
   `document.body`, which is outside `OverlayWrapper`'s ref; OverlayWrapper's
   capture-phase document "outside click" listener therefore treats the dropdown
   click as an outside click and calls `hideFn()`.
2. **Feature:** the picker only shows set *names*, so the user can't see or choose
   the card **artwork** — different printings have different art.

Fix both by replacing the set-name `Select` with an inline, always-visible
**artwork strip**: no portal (bug gone) and selection is by artwork (feature done).

## Decision (from brainstorming)

- **Approach:** visual artwork picker replacing the dropdown.
- **Layout:** Option A — an always-visible, horizontally-scrollable strip of printing
  artwork thumbnails placed below the card details and above the sticky action bar;
  the selected printing shows a gold ring; each thumbnail is captioned with its set name.

## Current state (reference)

- `client/src/components/decks/AddCardDialog.tsx` — the dialog. It already:
  - holds `selectedTcgId` state (defaults to `card.tcgplayer_id`);
  - fetches printings via `usePrintingsQuery(card.oracle_id)` → `PrintingData[]`
    where `PrintingData = { tcgplayer_id: number; setName: string; imageUrl: string }`
    (`imageUrl` is the printing's artwork — already available);
  - swaps the displayed card via `useCardByTcgIdQuery(selectedTcgId when different)`
    into `displayCard`, which drives the card view, prices, and the Add payload;
  - renders the printing picker as a shadcn `Select` (shown when `printings.length > 1`),
    whose `onValueChange` sets `selectedTcgId`;
  - shows a `Loader` (`loadingPrinting`) while a different printing loads.
- `client/src/components/ui/OverlayWrapper.tsx` — closes on a capture-phase document
  click when the target is outside its single content ref (the portal-click bug source).
- `client/src/components/decks/__tests__/AddCardDialog.test.tsx` — mocks the `Select`
  (and `usePrintingsQuery` returning `[]`), plus asserts render/quantity/validation/add.

## Design

### AddCardDialog change
- **Remove** the `Select` import and its JSX from the action bar.
- **Add** an artwork-strip section between the card view and the sticky action bar,
  rendered only when `printings && printings.length > 1`:
  - a small uppercase label (e.g. "Printing — choose artwork", `text-muted-foreground`);
  - a horizontally-scrollable flex row (`overflow-x-auto`) of thumbnails, one per
    `printings` entry; each thumbnail is the printing's `imageUrl` as a small `<img>`
    plus its `setName` caption beneath;
  - the thumbnail whose `tcgplayer_id === selectedTcgId` gets a gold selected treatment
    (`border-primary` + ring); others use `border-border`;
  - clicking a thumbnail calls `setSelectedTcgId(p.tcgplayer_id)` — which the existing
    `useCardByTcgIdQuery`/`displayCard` logic already turns into a swapped card view and
    Add payload. No new fetch/data logic.
- The existing `loadingPrinting` spinner behaviour is unchanged.
- Because the dropdown/portal is gone, the modal no longer closes when interacting with
  the picker.

### Data flow (unchanged mechanics)
`usePrintingsQuery(oracle_id)` → thumbnails; click → `setSelectedTcgId` →
`useCardByTcgIdQuery` → `displayCard` (art/oracle/prices) → Add sends `displayCard`.

### Error/edge handling
- 0 or 1 printing → no strip (nothing to choose).
- A printing whose fetch errors → `useCardByTcgIdQuery` data is undefined → `displayCard`
  falls back to the base `card` (graceful, current behaviour).

## Testing

Update `AddCardDialog.test.tsx` (Vitest, globals, colocated):
- Remove the `Select` mock.
- Mock `usePrintingsQuery` to return a 2+ entry `PrintingData[]` (with `imageUrl`/`setName`/
  `tcgplayer_id`).
- Assert: one thumbnail per printing renders with its set caption; the strip is absent
  when there's ≤1 printing; clicking a non-selected thumbnail calls the selection
  (drives `useCardByTcgIdQuery` with that id — verified via the mocked hook being called
  with the clicked id, or the selected-state class updating).
- Keep the existing assertions (renders card + price chips + quantity; stepper
  increments/clamps and Add sends `{ card, quantity }`; off-color and commander block the
  add; in-deck count).
- Preserve the full 108-test suite; gate on `npm run lint && npm run build && npm run test`.

## Out of scope (YAGNI)

- Hardening `OverlayWrapper` generally against portal-based children (other future
  portal components inside the overlay) — removing this `Select` resolves the reported
  bug; a general fix is a separate concern.
- The deck-list `ShowUniquePrintings` carousel (used elsewhere) — unchanged.
- Foil/price-per-printing display, sorting/filtering printings.
