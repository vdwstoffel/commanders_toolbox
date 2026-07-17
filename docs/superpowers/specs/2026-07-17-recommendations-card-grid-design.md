# Recommendations Tab — Card-Grid Redesign

**Date:** 2026-07-17
**Component:** `client/src/components/decks/CardRecomendations.tsx`
**Status:** Approved design

## Context

The deck detail "Recommendations" tab shows EDHREC card suggestions for the deck's
commander/theme. Today it renders a left sidebar of categories, a cramped middle
text list (`card name` + a `%`), and a hover-only card image on the right. Most of
the page is empty black space, owned cards are silently hidden, and every hover
triggers a Scryfall API call to fetch the preview image.

A separate earlier pass already fixed correctness bugs in this component (stale
React Query key, in-place sort mutation, `.map` holes / missing `key`, hover-timeout
ref, `onMouseLeave`, fetch error handling). This spec covers only the visual/UX
redesign.

## Goal

Replace the text list with a responsive **card grid** that fills the space, shows
real card art, keeps owned cards visible-but-dimmed, and supports quick-add — while
making **zero extra API calls** to render thumbnails.

## Data layer

EDHREC's cardview payload already returns more than the current type declares.
Confirmed fields: `id` (a Scryfall card UUID), `name`, `synergy`, `num_decks`,
`potential_decks`.

Changes in `client/src/api/edhRecApi.tsx`:

1. Extend the `EdhDeckThemeStats` cardview type to include `id: string`,
   `num_decks: number`, `potential_decks: number` (keep `name`, `synergy`).
2. Add a helper to build a Scryfall image URL from the card id:

   ```ts
   scryfallImageFromId(id: string, size = "normal") =>
     `https://cards.scryfall.io/${size}/front/${id[0]}/${id[1]}/${id}.jpg`
   ```

   Verified: this URL returns HTTP 200 for EDHREC ids. No Scryfall API call needed
   for grid thumbnails.

3. Inclusion % (headline number) = `round(num_decks / potential_decks * 100)`. This
   is the real "% of decks that run this card" figure and what the displayed "56%"
   represents. Synergy stays available as a subtle secondary signal. Sorting remains
   by `synergy` descending (already copied-before-sort).

## Component

`CardRecomendations.tsx`:

- Keep the left vertical `Tabs` sidebar (categories) unchanged.
- Replace the middle text list + right hover image with a **responsive card grid**
  inside a scroll container: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4
  lg:grid-cols-5 gap-4`.
- Each tile:
  - Lazy-loaded card art (`loading="lazy"`) from `scryfallImageFromId(card.id)`,
    rounded, card aspect ratio.
  - Footer overlay: card name + inclusion-% badge.
  - Hover: slight scale/highlight and a `+` quick-add button (top-right).
- **In-deck cards:** stay in the grid, dimmed (reduced opacity) with an "In deck"
  badge. No longer filtered out, so the grid never silently shrinks.
- **Interactions:**
  - Click tile body → existing `AddCardDialog` overlay (fetch full card via
    `scryfallApi.getCardByName`, unchanged).
  - Click `+` → fetch the `MagicCard` via Scryfall by name, then
    `useAddCardToDeck().addCard({ card, quantity: 1 })`. Button shows a pending
    spinner while `addingCard` is true; `stopPropagation` so it doesn't also open
    the dialog.
- Remove the old `hoveredCardImageUrl` state and the hover-driven Scryfall call
  (art is now inline).

## Layout

Replace the `3xl:w-1/3 w-2/3 grid-cols-3` container (which left large empty margins)
with a centered `mx-auto max-w-6xl` layout: sidebar column + grid column.

## Edge cases

- Broken image → `onError` swaps in a neutral placeholder (name-only tile).
- Category where every card is already in the deck → small note:
  "All recommended cards are already in your deck."
- Missing `id` on a cardview → render a name-only tile (no image).

## Testing

Colocated test in `client/src/components/decks/__tests__/` following existing
patterns (mock the query hook + `useAddCardToDeck`):

- Renders a grid tile per recommended card from mocked `recs`.
- In-deck cards render dimmed / with the "In deck" badge (not removed).
- Clicking `+` calls the add mutation with `quantity: 1`.
- Clicking the tile body opens `AddCardDialog`.

## Out of scope

- Top horizontal category bar (rejected in favor of keeping the left sidebar).
- Search/filter box, price display, mana cost line — possible later follow-ups.
- Any server-side change (recommendations are purely client-side).
