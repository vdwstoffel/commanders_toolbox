# Design: MTG-flavored dark visual refresh

Date: 2026-07-16
Status: Approved (pending spec review)

## Goal

A cohesive, dark, "MTG-flavored" visual refresh across the whole client. Today the
app has a shadcn/ui token theme defined but barely used: components hardcode colors
(`slate`/`stone`/`neutral`/`gray`, `text-red-500`, `border-blue-500`), the palette is
mixed, several pages are bare (HomePage, Login/Register, ErrorPage), and a raw
placeholder string is visible on DecksPage. This refresh establishes one dark palette
+ typography system and applies it everywhere.

## Decisions (from brainstorming)

- **Aesthetic:** MTG-flavored dark — "Obsidian & Gold."
- **Mode:** Dark only (no light mode, no toggle).
- **Palette:** warm near-black backgrounds, antique-gold primary accent, parchment text.
- **Typography:** Cinzel (display serif) for headings, Inter for body — self-hosted
  via `@fontsource` (no Google Fonts CDN), consistent with the project's local-first
  preference.
- **Homepage:** hero band + carousel rails.
- **Login/Register:** centered branded card.
- **Consistency rule:** tokens everywhere; no hardcoded Tailwind color names. The only
  "colorful" accents are the five MTG mana colors, sourced from dedicated CSS vars.

## Design system (foundation)

Rework `client/src/index.css` into a **dark-only** theme by putting the Obsidian & Gold
values directly in `:root` (so the app is dark by default without relying on a `.dark`
class). The existing light `:root` block is replaced; the `.dark` block may be dropped
or left equal to `:root`. Keep the existing `@theme inline` token wiring and radius
(`--radius: 0.625rem`).

Token values (hex shown for clarity; may be authored as OKLCH to match the current file):

| Token | Value | Notes |
|---|---|---|
| `--background` | `#0e0e10` | warm near-black page bg |
| `--foreground` | `#ece6d8` | parchment text |
| `--card`, `--popover` | `#1b1a17` | surfaces |
| `--card-foreground`, `--popover-foreground` | `#ece6d8` | |
| `--muted` | `#26241f` | secondary surface |
| `--muted-foreground` | `#a39d8e` | secondary text |
| `--secondary` | `#26241f` | |
| `--secondary-foreground` | `#ece6d8` | |
| `--primary` | `#c8a24a` | antique gold |
| `--primary-foreground` | `#1a1710` | text on gold |
| `--accent` | `#26241f` | subtle hover surface |
| `--accent-foreground` | `#ece6d8` | |
| `--border`, `--input` | `#33302a` | |
| `--ring` | `#c8a24a` | gold focus ring |
| `--destructive` | `#c0392b` | red tuned for dark |

New mana-color custom properties (added to `:root` and exposed via `@theme inline` so
they're usable as Tailwind utilities and in components/charts):

```
--mana-w: #f8f4e8;
--mana-u: #2a6db0;
--mana-b: #3a3a42;
--mana-r: #c0392b;
--mana-g: #2e8b57;
```

Because every shadcn/ui component already reads these tokens, the primary `Button`
becomes gold, `Card`/`Input`/`Select`/`Tabs`/etc. go dark automatically once the tokens
change. The `ColorDistributionPieChart` currently uses hardcoded MTG hex values; point
it at the mana vars so it stays consistent.

## Typography

- Add dependencies `@fontsource/cinzel` and `@fontsource/inter`.
- Import the needed weights in `client/src/main.tsx` (e.g. Inter 400/600/700/800,
  Cinzel 500/700/900).
- In `index.css`: set the body font to Inter; add a display-font token
  `--font-display: "Cinzel", serif;` wired through `@theme inline` so a `font-display`
  Tailwind utility exists.
- Apply Cinzel to page/section headings, deck titles, and the navbar brand. Body text,
  form inputs, buttons, and metadata stay Inter.

## Pages & components

### Homepage — hero band + rails (`client/src/pages/HomePage.tsx`)
- Hero band: Cinzel title + Inter tagline, two CTAs — primary gold "Create a Deck"
  (→ `/decks/new-deck`) and outline "Explore Decks" (→ `/explore/...`), over a subtle
  radial gradient using theme colors.
- Below: the two existing commander carousels (all-time, monthly) restyled as labeled
  rails. Reuse existing carousel data/components; only styling changes.

### Login / Register (`client/src/pages/LoginPage.tsx`, `RegisterPage.tsx`)
- Centered shadcn `Card` on the dark background: logo (`public/logo.png`) + Cinzel
  title ("Commander's Toolbox") above the form; primary gold submit; link to the other
  page.
- **Test-preserving constraints (do not break the existing suite):** keep the `Label`
  `htmlFor="email"`/`Input id="email"` and `password` pairing (so `getByLabelText`
  works), keep the submit button accessible names exactly `Login` / `Register`, and keep
  rendering the error message text on failure. Swap the hardcoded `text-red-500` for
  `text-destructive`.

### Navbar (`client/src/components/ui/Navbar.tsx`)
- Retune to tokens: header background to a near-black/`background`-derived color,
  brand text in Cinzel gold, links use `foreground`/`muted-foreground` with themed hover.
- Preserve structure, the Headless UI menus, mobile responsiveness, the `Login` NavLink,
  the `UserCircleIcon` menu, and `Sign out` behavior (all added in the auth work).

### DeckDetails, explore pages, CustomTabs, OverlayWrapper
- Replace hardcoded `slate/stone/neutral/gray` utility colors with theme tokens
  (`bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`,
  gold `primary` for emphasis). Deck color identity uses the mana vars.

### Shared UI atoms
- `Loader` (`client/src/components/ui/Loader.tsx`): `border-blue-500` → `border-primary`.
- `ErrorMessage` (`client/src/components/ui/ErrorMessage.tsx`): `text-red-500` →
  `text-destructive`.

### DecksPage (`client/src/pages/DecksPage.tsx`)
- Add a real **empty state** (no decks → friendly Cinzel prompt + gold "Create a Deck"
  CTA). Replace the raw "Should make a error for decks error" placeholder with a themed
  error state (reuse `ErrorMessage`) and themed loading (`Loader`).

### ErrorPage (`client/src/pages/ErrorPage.tsx`)
- Style consistently with the theme (centered card, Cinzel heading).

## Consistency rule

After this pass, no client component should use a hardcoded Tailwind color name
(`slate-*`, `stone-*`, `neutral-*`, `gray-*`, `red-500`, `blue-500`, etc.) for
chrome/text/surfaces. All chrome comes from tokens; the only literal colors are the five
mana identities, and those come from `--mana-*`.

## Testing

This is a presentational refresh; correctness is preserved by keeping the existing 94
tests green.

- **Preserve accessible contracts** so current tests pass: Login/Register labels
  (`Email`/`Password`), button names (`Login`/`Register`), error text rendering; Navbar
  `Login` link text; any `getByText`/`getByRole` anchors used by existing tests.
- **Add one test:** DecksPage empty state renders the "Create a Deck" CTA when the user
  has no decks.
- Run `npm run lint`, `npm run build`, `npm run test` as the gate. New/changed files
  under linted paths (`src/pages`, `src/api`, non-ignored dirs) must be lint-clean.
- Manual visual check of each restyled page (dark render, gold accents, fonts loaded).

## Out of scope (YAGNI)

- Light mode / theme toggle.
- New features or data changes (this is styling only).
- Restructuring routing or component architecture beyond what styling requires.
- Replacing the icon libraries or the carousel/chart libraries.
- Optimizing the large `logo.png`/`favicon.ico` assets (noted, but separate).
