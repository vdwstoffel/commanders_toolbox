# MTG Dark Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a cohesive dark, MTG-flavored ("Obsidian & Gold") visual refresh across the whole client — one token palette, Cinzel/Inter typography, redesigned bare pages, and hardcoded colors replaced by theme tokens everywhere.

**Architecture:** Retint the existing shadcn/ui Tailwind-v4 token theme (`client/src/index.css`) to Obsidian & Gold and turn dark mode on globally. Because every shadcn component already reads the tokens, most of the app restyles automatically once the tokens change; the remaining work is replacing hardcoded Tailwind color utilities (`slate/stone/neutral/gray`, `red-500`, `blue-500`, etc.) with tokens and redesigning the bare pages (Home, Login/Register, DecksPage states).

**Tech Stack:** React 19 + TypeScript + Vite, Tailwind CSS v4 (`@theme inline`), shadcn/ui, self-hosted fonts via `@fontsource`, Vitest + React Testing Library.

## Global Constraints

- Client formatting: Prettier `printWidth: 133`, 2-space indent.
- Vitest globals are ENABLED — do NOT import `describe`/`it`/`expect`/`vi` in tests (existing tests don't). The `@` alias maps to `client/src`.
- Dark-only. No light mode, no toggle.
- **Tokens everywhere:** after this plan, no client component may use a hardcoded Tailwind color name (`slate-*`, `stone-*`, `neutral-*`, `gray-*`, `red-500`, `red-700`, `blue-500`, `blue-600`, `amber-50`, `bg-white`, `bg-black`, `text-white`/`border-black` used as chrome) for surfaces/text/borders. The only literal colors allowed are the five mana identities, sourced from the `--mana-*` vars / `bg-mana-*`/`text-mana-*` utilities. (`text-white` inside shadcn `button.tsx`'s destructive variant is pre-existing and may stay.)
- Typography: **Cinzel** (display serif) for headings, **Inter** for body — self-hosted via `@fontsource` (NO Google Fonts CDN).
- **Test-preserving contracts (do not break the 94-test suite):**
  - LoginPage: `Label`/`Input` pairing for `email`/`password` (so `getByLabelText("Email")`/`("Password")` work), submit button accessible name exactly `Login`, error message rendered as text, `navigate("/decks")` on success.
  - RegisterPage: same, but submit button name exactly `Register`.
  - Navbar: a visible element with text exactly `Login` in the unauthenticated branch.
  - DeckList detail view: keep passing the exact heading strings `Commander` / `Creatures` / `Lands` to `CardTypeContainer`, and the button labels `Populate Lands` / `Download deck` / `Copy to clipboard`, and `data-testid="magic-card-image"`. (Color/class changes are safe; these are text/testid anchors.)
- Commits: short, plain messages, NO `Co-Authored-By` trailer. Branch: `visual-refresh`.
- Gate for every task: `cd client && npm run lint && npm run build && npm run test` must pass (ESLint clean; `tsc -b && vite build` succeeds; Vitest suite green). Iterate with `npx vitest run <file>` while working.

## Token mapping (reference for all "tokenize" tasks)

Replace hardcoded utilities with tokens per this table. Tasks 2, 3, 6, 7, 8 all use it.

| Current (hardcoded) | Replace with |
|---|---|
| `bg-neutral-900`, `bg-slate-950`, `bg-stone-800` (bars/headers/panels) | `bg-card` |
| `bg-neutral-700`, `bg-neutral-700/50` | `bg-card/80` |
| `bg-slate-200/30`, `bg-slate-100/30`, `bg-slate-500/30` (subtle fills) | `bg-muted` |
| `text-neutral-200`, `text-stone-100`, `text-stone-300`, `text-slate-100`, `text-slate-50` | `text-foreground` |
| `text-gray-300`, `text-gray-400` (muted) | `text-muted-foreground` |
| `bg-gray-800` | `bg-muted` |
| `bg-gray-900 text-white` (active nav) | `bg-accent text-accent-foreground` |
| `hover:bg-gray-700`, `hover:bg-slate-200/15` | `hover:bg-accent` |
| `hover:text-white`, `hover:text-slate-50` | `hover:text-accent-foreground` |
| `bg-white` (dropdown panel) + `text-gray-700` | `bg-popover` + `text-popover-foreground` |
| `hover:bg-gray-100`, `data-focus:bg-gray-100` | `hover:bg-accent`, `data-focus:bg-accent` |
| `text-red-500`, `text-red-700` | `text-destructive` |
| `hover:bg-red-700` | `hover:bg-destructive/90` |
| `border-blue-500` | `border-primary` |
| `focus:ring-blue-500`, `focus:ring-white` | `focus:ring-ring` |
| `peer-checked:bg-blue-600` | `peer-checked:bg-primary` |
| `border-amber-50`, `border-slate-400/30` | `border-border` |
| `outline-slate-400` | `outline-ring` |
| `hover:shadow-slate-200/70` | `hover:shadow-2xl` (drop the color tint) |
| `bg-gray-100` (ThemeCard) | `bg-card` |
| `border-black` + `hover:bg-black hover:text-white` | `border-border` + `hover:bg-primary hover:text-primary-foreground` |

When a component has `dark:`-prefixed duplicates of the above (e.g. ShowTokens), delete the now-redundant `dark:` variants (the app is always dark).

---

## Task 1: Theme foundation — Obsidian & Gold tokens, fonts, dark mode on

**Files:**
- Modify: `client/package.json` (add `@fontsource/cinzel`, `@fontsource/inter`)
- Modify: `client/src/index.css` (retint tokens, add mana + font tokens, base layer)
- Modify: `client/index.html` (`<html class="dark">`)
- Modify: `client/src/main.tsx` (import fonts, theme the Toaster)

**Interfaces:**
- Produces: CSS tokens `--background/--foreground/--card/--primary/...` = Obsidian & Gold; mana utilities `bg-mana-w|u|b|r|g` and `text-mana-*` (via `--color-mana-*`); `font-display` utility (Cinzel) + default `font-sans` (Inter); headings default to Cinzel via a base rule. The whole app renders dark.

This task is theming/config — verified by build + the existing suite staying green (not TDD; there is no meaningful unit test for CSS tokens).

- [ ] **Step 1: Add font packages**

Run: `cd client && npm install @fontsource/cinzel @fontsource/inter`
Expected: both added to `package.json` dependencies; lockfile updated.

- [ ] **Step 2: Import fonts and theme the Toaster in `client/src/main.tsx`**

Replace the file contents with:

```tsx
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cinzel/900.css";

import "./index.css";
import App from "./App.tsx";
import UserContextProvider from "./components/user/UserContextProvider.tsx";
import { registerAuthInterceptor } from "./api/authInterceptor";

registerAuthInterceptor();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <UserContextProvider>
      <App />
      <Toaster
        toastOptions={{
          style: { background: "#1b1a17", color: "#ece6d8", border: "1px solid #33302a" },
        }}
      />
    </UserContextProvider>
  </QueryClientProvider>
);
```

- [ ] **Step 3: Enable dark mode globally in `client/index.html`**

Change `<html lang="en">` to:

```html
<html lang="en" class="dark">
```

- [ ] **Step 4: Retint tokens and add mana/font tokens in `client/src/index.css`**

Replace the whole file with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: var(--font-sans);
  --font-display: var(--font-display);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-mana-w: var(--mana-w);
  --color-mana-u: var(--mana-u);
  --color-mana-b: var(--mana-b);
  --color-mana-r: var(--mana-r);
  --color-mana-g: var(--mana-g);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.625rem;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Cinzel", serif;

  --background: #0e0e10;
  --foreground: #ece6d8;
  --card: #1b1a17;
  --card-foreground: #ece6d8;
  --popover: #1b1a17;
  --popover-foreground: #ece6d8;
  --primary: #c8a24a;
  --primary-foreground: #1a1710;
  --secondary: #26241f;
  --secondary-foreground: #ece6d8;
  --muted: #26241f;
  --muted-foreground: #a39d8e;
  --accent: #33302a;
  --accent-foreground: #ece6d8;
  --destructive: #c0392b;
  --border: #33302a;
  --input: #33302a;
  --ring: #c8a24a;

  --chart-1: #c8a24a;
  --chart-2: #2a6db0;
  --chart-3: #2e8b57;
  --chart-4: #c0392b;
  --chart-5: #a39d8e;

  --mana-w: #f8f4e8;
  --mana-u: #2a6db0;
  --mana-b: #3a3a42;
  --mana-r: #c0392b;
  --mana-g: #2e8b57;

  --sidebar: #141310;
  --sidebar-foreground: #ece6d8;
  --sidebar-primary: #c8a24a;
  --sidebar-primary-foreground: #1a1710;
  --sidebar-accent: #33302a;
  --sidebar-accent-foreground: #ece6d8;
  --sidebar-border: #33302a;
  --sidebar-ring: #c8a24a;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
  h1,
  h2,
  h3 {
    font-family: var(--font-display);
  }
}
```

(The previous `.dark { … }` override block is intentionally removed: tokens now live in `:root`, and `<html class="dark">` still activates components' `dark:` variant utilities.)

- [ ] **Step 5: Build and run the full suite**

Run: `cd client && npm run build && npm run test`
Expected: `tsc -b && vite build` succeeds; Vitest reports all existing tests passing (94). If any fail, they indicate a real regression — fix before committing.

- [ ] **Step 6: Sanity-check the foundation**

Run: `cd client && grep -q 'class="dark"' index.html && grep -q 'font-display' src/index.css && grep -q '@fontsource/cinzel' package.json && echo OK`
Expected: `OK`.

- [ ] **Step 7: Commit**

```bash
git add client/package.json client/package-lock.json client/index.html client/src/index.css client/src/main.tsx
git commit -m "client: retint theme to Obsidian & Gold dark, add Cinzel/Inter fonts, enable dark mode"
```

---

## Task 2: Shared atoms — Loader, ErrorMessage, NewDeckForm error

**Files:**
- Modify: `client/src/components/ui/Loader.tsx:4`
- Modify: `client/src/components/ui/ErrorMessage.tsx:4`
- Modify: `client/src/components/decks/NewDeckForm.tsx:108`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: themed spinner (gold) and destructive-colored error text.

- [ ] **Step 1: Loader — gold spinner**

In `client/src/components/ui/Loader.tsx`, change `border-blue-500` to `border-primary`:

```tsx
export default function Loader() {
  return (
    <div data-testid="loader" className="flex items-center justify-center m-5">
      <div className="w-12 h-12 border-4 border-primary border-solid border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
```

- [ ] **Step 2: ErrorMessage — destructive text**

In `client/src/components/ui/ErrorMessage.tsx`, change `text-red-500` to `text-destructive`:

```tsx
export default function ErrorMessage({ msg }: { msg: string }) {
  return (
    <div data-testid="error-message" className="mx-auto w-fit mt-10">
      <h1 className="text-center mx-auto py-1/2 text-destructive font-bold text-xl">{msg}</h1>
    </div>
  );
}
```

- [ ] **Step 3: NewDeckForm error text**

In `client/src/components/decks/NewDeckForm.tsx` line 108, change `text-red-500` to `text-destructive` (the error `<p>`):

```tsx
          {error && <p className="text-destructive font-bold">{error}</p>}
```

- [ ] **Step 4: Verify**

Run: `cd client && npx vitest run src/components/decks/__tests__/DeckList.test.tsx && npm run lint`
Expected: DeckList tests pass (they exercise Loader/ErrorMessage indirectly); lint clean.
Run: `cd client && grep -rnE 'border-blue-500|text-red-500' src/components/ui src/components/decks/NewDeckForm.tsx || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ui/Loader.tsx client/src/components/ui/ErrorMessage.tsx client/src/components/decks/NewDeckForm.tsx
git commit -m "client: theme Loader/ErrorMessage/form error to tokens"
```

---

## Task 3: Navbar — tokenized dark bar with Cinzel brand

**Files:**
- Modify: `client/src/components/ui/Navbar.tsx` (full rewrite of the returned JSX chrome)
- Test: `client/src/components/ui/__tests__/Navbar.test.tsx` (existing — must stay green)

**Interfaces:**
- Consumes: tokens/fonts from Task 1; `useUser()` → `{ isAuthenticated, logout }`; `NavLink`, `useNavigate`.
- Produces: dark navbar using `bg-card`/`text-foreground`/`text-muted-foreground`/`bg-popover`, gold Cinzel brand, unchanged structure and the exact `Login` text in the unauthenticated branch.

- [ ] **Step 1: Run the Navbar test first (baseline green)**

Run: `cd client && npx vitest run src/components/ui/__tests__/Navbar.test.tsx`
Expected: PASS (1 test). This is the anchor to keep green.

- [ ] **Step 2: Rewrite `client/src/components/ui/Navbar.tsx`**

Keep imports/`navigation`/`subMenu`/`classNames`/hooks identical; replace all hardcoded color classes per the Token mapping, add a Cinzel gold brand wordmark next to the logo, and fix the stray `alt="Your Company"`. Full file:

```tsx
import { useUser } from "../user/useUser";
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bars3Icon, XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../../public/logo.png";

const navigation = [
  { name: "Home", href: "/", current: false },
  { name: "Decks", href: "/decks", current: false },
];

const subMenu = [
  { name: "Color", href: "/explore/color" },
  { name: "Theme", href: "/explore/themes" },
  { name: "Kindred", href: "/explore/kindred" },
];

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  /** Auth details */
  const { isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  /** FUNCTIONS */
  function logoutHandler() {
    logout();
    navigate("/");
  }

  return (
    <Disclosure as="nav" className="bg-card border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center gap-2">
              <img alt="Commander's Toolbox logo" src={logo} className="h-8 w-auto" />
              <span className="hidden sm:block font-display text-lg font-bold tracking-wide text-primary">Commander's Toolbox</span>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                      item.current ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      "rounded-md px-3 py-2 text-sm font-medium"
                    )}
                  >
                    {item.name}
                  </NavLink>
                ))}
                {/* Dropdown menu for the explore pages */}
                <Menu as="div" className="relative">
                  <MenuButton className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
                    Explore
                    <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.66a.75.75 0 01-1.08 0l-4.25-4.66a.75.75 0 01.02-1.06z" />
                    </svg>
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border focus:outline-none z-10">
                    {subMenu.map((item) => {
                      return (
                        <MenuItem key={item.name}>
                          <NavLink to={item.href} className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent">
                            {item.name}
                          </NavLink>
                        </MenuItem>
                      );
                    })}
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Profile dropdown If user is not logged in show login button */}
            {isAuthenticated ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <MenuButton className="relative flex rounded-full bg-muted text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-hidden">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <UserCircleIcon aria-hidden="true" className="size-8 rounded-full text-muted-foreground" />
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <a href="#" className="block px-4 py-2 text-sm text-popover-foreground data-focus:bg-accent data-focus:outline-hidden">
                      Your Profile
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a href="#" className="block px-4 py-2 text-sm text-popover-foreground data-focus:bg-accent data-focus:outline-hidden">
                      Settings
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <p
                      onClick={logoutHandler}
                      className="block px-4 py-2 text-sm text-popover-foreground data-focus:bg-accent data-focus:outline-hidden hover:cursor-pointer"
                    >
                      Sign out
                    </p>
                  </MenuItem>
                </MenuItems>
              </Menu>
            ) : (
              <NavLink to="/login" className="text-muted-foreground hover:text-foreground hover:cursor-pointer">
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              aria-current={item.current ? "page" : undefined}
              className={classNames(
                item.current ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "block rounded-md px-3 py-2 text-base font-medium"
              )}
            >
              {item.name}
            </NavLink>
          ))}
          {/* Dropdown menu for the explore pages */}
          <Menu as="div" className="relative">
            <MenuButton className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
              Explore
              <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.66a.75.75 0 01-1.08 0l-4.25-4.66a.75.75 0 01.02-1.06z" />
              </svg>
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border focus:outline-none z-10">
              {subMenu.map((item) => {
                return (
                  <MenuItem key={item.name}>
                    <NavLink to={item.href} className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent">
                      {item.name}
                    </NavLink>
                  </MenuItem>
                );
              })}
            </MenuItems>
          </Menu>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
```

- [ ] **Step 3: Verify the test still passes**

Run: `cd client && npx vitest run src/components/ui/__tests__/Navbar.test.tsx`
Expected: PASS (the `Login` text is preserved).
Run: `cd client && grep -nE 'gray-|neutral-|bg-white' src/components/ui/Navbar.tsx || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ui/Navbar.tsx
git commit -m "client: retune Navbar to theme tokens with Cinzel brand"
```

---

## Task 4: Homepage — hero band + carousel rails

**Files:**
- Modify: `client/src/pages/HomePage.tsx` (redesign)
- Modify: `client/src/components/explore/TopCommanderCarousel.tsx:34,43` (drop hardcoded colors)
- Test: `client/src/pages/__tests__/HomePage.test.tsx` (new)

**Interfaces:**
- Consumes: `TopCommanderCarousel` (default export, prop `period: "year" | "month" | "week"`); `useNavigate`; Button.
- Produces: a hero band (Cinzel title, tagline, gold "Create a Deck" + outline "Explore Decks" CTAs) above two labeled carousel rails.

- [ ] **Step 1: Write the failing test `client/src/pages/__tests__/HomePage.test.tsx`**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "../HomePage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));
vi.mock("@/components/explore/TopCommanderCarousel", () => ({
  default: ({ period }: { period: string }) => <div data-testid="carousel">carousel-{period}</div>,
}));

describe("HomePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the hero CTAs and both commander rails", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: "Create a Deck" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore Decks" })).toBeInTheDocument();
    expect(screen.getByTestId("carousel")).toBeTruthy();
    expect(screen.getAllByTestId("carousel")).toHaveLength(2);
  });

  it("navigates to new-deck when Create a Deck is clicked", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Create a Deck" }));
    expect(mockNavigate).toHaveBeenCalledWith("/decks/new-deck");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd client && npx vitest run src/pages/__tests__/HomePage.test.tsx`
Expected: FAIL — HomePage has no "Create a Deck" button yet.

- [ ] **Step 3: Redesign `client/src/pages/HomePage.tsx`**

```tsx
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import TopCommanderCarousel from "@/components/explore/TopCommanderCarousel";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="border-b border-border bg-[radial-gradient(120%_120%_at_50%_0%,var(--muted)_0%,var(--background)_70%)] px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-foreground">Build Your Perfect Commander Deck</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Build, analyze, and explore EDH decks with real card data.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={() => navigate("/decks/new-deck")}>Create a Deck</Button>
          <Button variant="outline" onClick={() => navigate("/explore/color")}>
            Explore Decks
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Top Commanders — All Time</h2>
        <TopCommanderCarousel period="year" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Trending This Month</h2>
        <TopCommanderCarousel period="month" />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Fix hardcoded colors in `client/src/components/explore/TopCommanderCarousel.tsx`**

Line 34: change `border border-amber-50` to `border border-border`. Line 43: change `focus:ring-blue-500` to `focus:ring-ring`:

```tsx
    <div className="flex flex-col mx-20 border border-border">
```
```tsx
                className="basis-1/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd client && npx vitest run src/pages/__tests__/HomePage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/HomePage.tsx client/src/pages/__tests__/HomePage.test.tsx client/src/components/explore/TopCommanderCarousel.tsx
git commit -m "client: redesign homepage with hero band + carousel rails"
```

---

## Task 5: Login / Register — centered branded cards

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`
- Modify: `client/src/pages/RegisterPage.tsx`
- Test: `client/src/pages/__tests__/LoginPage.test.tsx`, `RegisterPage.test.tsx` (existing — must stay green)

**Interfaces:**
- Consumes: `useUser()` → `login`/`register`; shadcn `Card`, `Button`, `Input`, `Label`; `NavLink`, `useNavigate`.
- Produces: centered branded auth cards. **Preserves** the `Email`/`Password` label→input pairing, the `Login`/`Register` submit button names, error text rendering, `navigate("/decks")`, and the `/register`↔`/login` NavLink targets.

- [ ] **Step 1: Baseline — run the existing auth tests**

Run: `cd client && npx vitest run src/pages/__tests__/LoginPage.test.tsx src/pages/__tests__/RegisterPage.test.tsx`
Expected: PASS (4 tests). These must remain green after the redesign.

- [ ] **Step 2: Redesign `client/src/pages/LoginPage.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../public/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="Commander's Toolbox logo" className="mx-auto h-14 w-auto" />
          <CardTitle className="font-display text-2xl text-primary">Commander's Toolbox</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitHandler} className="grid gap-4">
            {error && <p className="text-destructive font-bold text-sm">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              No account?{" "}
              <NavLink to="/register" className="text-primary underline">
                Register
              </NavLink>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Redesign `client/src/pages/RegisterPage.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../public/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="Commander's Toolbox logo" className="mx-auto h-14 w-auto" />
          <CardTitle className="font-display text-2xl text-primary">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitHandler} className="grid gap-4">
            {error && <p className="text-destructive font-bold text-sm">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              Register
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <NavLink to="/login" className="text-primary underline">
                Login
              </NavLink>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify the existing auth tests still pass**

Run: `cd client && npx vitest run src/pages/__tests__/LoginPage.test.tsx src/pages/__tests__/RegisterPage.test.tsx`
Expected: PASS (4 tests). If `getByLabelText`/`getByRole("button", {name})`/`getByText(error)` fail, the label/id pairing, button name, or error rendering was broken — fix to match the constraints.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/LoginPage.tsx client/src/pages/RegisterPage.tsx
git commit -m "client: redesign login/register as centered branded cards"
```

---

## Task 6: DecksPage states + DeckBox chrome

**Files:**
- Modify: `client/src/pages/DecksPage.tsx` (empty + error states)
- Modify: `client/src/components/decks/DeckBox.tsx:13,15,22,33` (tokenize)
- Test: `client/src/pages/__tests__/DecksPage.test.tsx` (new)

**Interfaces:**
- Consumes: `useGetDecks(idToken)` → `{ deckData, getDecksError, waitingForDecks }`; `useUser()` → `{ idToken }`; `useNavigate`; `Loader`; `ErrorMessage`; `DeckBox`; `Button`.
- Produces: a real empty state (Cinzel prompt + "Create a Deck" CTA) when `deckData` is empty; a themed error state via `ErrorMessage`; tokenized deck cards.

- [ ] **Step 1: Write the failing test `client/src/pages/__tests__/DecksPage.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import DecksPage from "../DecksPage";
import { useGetDecks } from "@/components/decks/useDeckQuery";
import { useUser } from "@/components/user/useUser";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));
vi.mock("@/components/user/useUser");
vi.mock("@/components/decks/useDeckQuery");
vi.mock("@/components/decks/DeckBox", () => ({
  default: ({ deckName }: { deckName: string }) => <div data-testid="deck-box">{deckName}</div>,
}));

describe("DecksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ idToken: "tok" });
  });

  it("shows an empty state with a Create a Deck CTA when there are no decks", () => {
    (useGetDecks as jest.Mock).mockReturnValue({ deckData: [], getDecksError: null, waitingForDecks: false });
    render(<DecksPage />);
    expect(screen.getByRole("button", { name: "Create a Deck" })).toBeInTheDocument();
    expect(screen.queryByTestId("deck-box")).toBeNull();
  });

  it("renders deck boxes when decks exist", () => {
    (useGetDecks as jest.Mock).mockReturnValue({
      deckData: [{ deckId: 1, deckName: "Muldrotha", deckImageUri: ["a.jpg"] }],
      getDecksError: null,
      waitingForDecks: false,
    });
    render(<DecksPage />);
    expect(screen.getByTestId("deck-box")).toHaveTextContent("Muldrotha");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd client && npx vitest run src/pages/__tests__/DecksPage.test.tsx`
Expected: FAIL — no "Create a Deck" button / empty-state branch yet.

- [ ] **Step 3: Rewrite `client/src/pages/DecksPage.tsx`**

```tsx
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user/useUser";
import { useGetDecks } from "@/components/decks/useDeckQuery";
import Loader from "@/components/ui/Loader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import DeckBox from "@/components/decks/DeckBox";

export default function DecksPage() {
  const navigate = useNavigate();
  const { idToken } = useUser();
  const { deckData, getDecksError, waitingForDecks } = useGetDecks(idToken);

  if (waitingForDecks) return <Loader />;
  if (getDecksError) return <ErrorMessage msg="Could not load your decks. Please try again." />;

  if (!deckData || deckData.length === 0) {
    return (
      <div className="mx-auto mt-20 flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-3xl text-foreground">No decks yet</h1>
        <p className="text-muted-foreground">Start building your first Commander deck.</p>
        <Button onClick={() => navigate("/decks/new-deck")}>Create a Deck</Button>
      </div>
    );
  }

  return (
    <div className="text-center mt-10">
      <Button onClick={() => navigate("/decks/new-deck")}>Create a Deck</Button>
      <div className="mt-10 grid place-items-center gap-6 sm:grid-cols-2 md:grid-cols-4 px-3 py-2">
        {deckData.map((deck) => {
          return <DeckBox key={deck.deckId} deckId={deck.deckId} deckName={deck.deckName} deckImage={deck.deckImageUri} />;
        })}
      </div>
    </div>
  );
}
```

(Note: the "Create new deck" button label becomes "Create a Deck" for consistency with the homepage; no test depended on the old label.)

- [ ] **Step 4: Tokenize `client/src/components/decks/DeckBox.tsx`**

Replace `hover:shadow-slate-200/70` → `hover:shadow-2xl` and `bg-neutral-700/50 ... text-neutral-200` → `bg-card/80 ... text-card-foreground` in both branches. Full file:

```tsx
import { Link } from "react-router-dom";

interface Props {
  deckName: string;
  deckImage: string[];
  deckId: number;
}

export default function DeckBox({ deckName, deckImage, deckId }: Props) {
  if (deckImage.length === 1) {
    return (
      <Link to={`/decks/${deckId}`}>
        <div className="relative shadow hover:cursor-pointer hover:shadow-2xl sm:w-36 md:w-24 lg:w-72">
          <img src={deckImage[0]} alt="mtgCard-img" className="rounded-xl" />
          <p className="absolute bottom-0 w-full rounded-b-xl bg-card/80 font-bold text-card-foreground">{deckName}</p>
        </div>
      </Link>
    );
  } else {
    return (
      <Link to={`/decks/${deckId}`}>
        <div className="group relative shadow hover:cursor-pointer hover:shadow-2xl sm:w-36 md:w-24 lg:w-72">
          <img
            src={deckImage[0]}
            alt="mtgCard-img"
            className="rounded-xl transition-opacity duration-300 ease-in-out group-hover:opacity-0"
          />
          <img
            src={deckImage[1]}
            alt="mtgCard-img"
            className="absolute left-0 top-0 rounded-xl opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
          />
          <p className="absolute bottom-0 w-full rounded-b-xl bg-card/80 font-bold text-card-foreground">{deckName} [Partner]</p>
        </div>
      </Link>
    );
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd client && npx vitest run src/pages/__tests__/DecksPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/DecksPage.tsx client/src/components/decks/DeckBox.tsx client/src/pages/__tests__/DecksPage.test.tsx
git commit -m "client: add DecksPage empty/error states and tokenize DeckBox"
```

---

## Task 7: Deck-detail chrome sweep

**Files (all Modify — replace hardcoded colors per the Token mapping):**
- `client/src/pages/DeckDetails.tsx:163,171,187,198,225`
- `client/src/components/ui/CustomTabs.tsx:16,22,23`
- `client/src/components/ui/OverlayWrapper.tsx:36`
- `client/src/components/decks/DeckList.tsx:199`
- `client/src/components/decks/CardTypeContainer.tsx:15`
- `client/src/components/decks/TypeTotalVsAverage.tsx:38`
- `client/src/components/decks/LandCycles.tsx:51,73`
- `client/src/components/decks/ShowTokens.tsx:52,53`
- `client/src/components/playtest/Playtest.tsx:55,59,64`

**Interfaces:** Consumes tokens from Task 1. No behavioral change — colors only. Preserve the DeckList text/heading/button anchors (Token mapping only changes classes, not text).

- [ ] **Step 1: Baseline — DeckList test green**

Run: `cd client && npx vitest run src/components/decks/__tests__/DeckList.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 2: DeckDetails.tsx** — apply these exact replacements:
  - L163 `bg-stone-800 text-stone-300` → `bg-card text-muted-foreground`
  - L171 `bg-slate-500/30` → `bg-muted`
  - L187 `text-red-700` → `text-destructive`
  - L198 `hover:bg-red-700` → `hover:bg-destructive/90`
  - L225 `bg-slate-100/30` → `bg-muted`

- [ ] **Step 3: CustomTabs.tsx** — L16 `bg-neutral-900 text-neutral-200` → `bg-card text-foreground`; L22 `bg-slate-200/30 text-slate-100` → `bg-accent text-accent-foreground`; L23 `hover:text-slate-50 hover:bg-slate-200/15` → `hover:text-accent-foreground hover:bg-accent`.

- [ ] **Step 4: OverlayWrapper.tsx** — L36 `bg-neutral-900/80 ... text-neutral-200` → `bg-popover/95 ... text-popover-foreground`.

- [ ] **Step 5: DeckList.tsx** — L199 `bg-slate-200/30` → `bg-muted`.

- [ ] **Step 6: CardTypeContainer.tsx** — L15 `border-slate-400/30` → `border-border`.

- [ ] **Step 7: TypeTotalVsAverage.tsx** — L38 `bg-slate-100/30` → `bg-muted`.

- [ ] **Step 8: LandCycles.tsx** — L51 & L73 `bg-neutral-700 text-neutral-200` → `bg-card text-card-foreground`.

- [ ] **Step 9: ShowTokens.tsx** — L52 `bg-gray-200 ... after:border-gray-300 after:bg-white peer-checked:bg-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-blue-600` → `bg-input ... after:border-border after:bg-foreground peer-checked:bg-primary` (drop the now-redundant `dark:` duplicates and the `bg-white` knob → `bg-foreground`); L53 `text-gray-900 dark:text-gray-300` → `text-foreground`.

- [ ] **Step 10: Playtest.tsx** — L55, L59, L64 `bg-slate-950 text-stone-100` → `bg-card text-card-foreground`; on L64 also `disabled:bg-slate-400/30` → `disabled:bg-muted`.

- [ ] **Step 11: Verify**

Run: `cd client && npx vitest run src/components/decks/__tests__/DeckList.test.tsx && npm run lint`
Expected: DeckList 6 tests PASS; lint clean.
Run: `cd client && grep -rnE 'slate-|stone-|neutral-|gray-|red-500|red-700|blue-500|blue-600' src/pages/DeckDetails.tsx src/components/ui/CustomTabs.tsx src/components/ui/OverlayWrapper.tsx src/components/decks/DeckList.tsx src/components/decks/CardTypeContainer.tsx src/components/decks/TypeTotalVsAverage.tsx src/components/decks/LandCycles.tsx src/components/decks/ShowTokens.tsx src/components/playtest/Playtest.tsx || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 12: Commit**

```bash
git add client/src/pages/DeckDetails.tsx client/src/components/ui/CustomTabs.tsx client/src/components/ui/OverlayWrapper.tsx client/src/components/decks/DeckList.tsx client/src/components/decks/CardTypeContainer.tsx client/src/components/decks/TypeTotalVsAverage.tsx client/src/components/decks/LandCycles.tsx client/src/components/decks/ShowTokens.tsx client/src/components/playtest/Playtest.tsx
git commit -m "client: tokenize deck-detail chrome colors"
```

---

## Task 8: Explore chrome, mana chart, and ErrorPage

**Files:**
- Modify: `client/src/components/explore/ThemeCard.tsx:11`
- Modify: `client/src/components/explore/ExploreColor.tsx:109`
- Modify: `client/src/components/stats/ColorDistributionPieChart.tsx:46-50` (mana tokens)
- Modify: `client/src/pages/ErrorPage.tsx` (theme + center properly)

**Interfaces:** Consumes tokens + `--mana-*` from Task 1. Chart fills use the mana CSS vars.

- [ ] **Step 1: ThemeCard.tsx** — L11 `bg-gray-100 ... border-black ... hover:bg-black hover:text-white` → `bg-card ... border-border ... hover:bg-primary hover:text-primary-foreground` (keep the rest of the classes, e.g. `rounded-2xl`, `text-sm`, spacing).

- [ ] **Step 2: ExploreColor.tsx** — L109 `outline-slate-400` → `outline-ring`.

- [ ] **Step 3: ColorDistributionPieChart.tsx** — replace the 5 hardcoded hex fills (lines 46-50) with the mana CSS vars so the chart matches the theme. Change each `fill` value:
  - `#F9FAF4` → `var(--mana-w)`
  - `#0E68AB` → `var(--mana-u)`
  - `#150B00` → `var(--mana-b)`
  - `#D3202A` → `var(--mana-r)`
  - `#00733E` → `var(--mana-g)`

  (Recharts accepts a CSS `var(...)` string as a `fill`; the vars are defined on `:root`.)

- [ ] **Step 4: Rewrite `client/src/pages/ErrorPage.tsx`** to theme and center it properly:

```tsx
import Navbar from "@/components/ui/Navbar";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string };

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-5xl text-primary">Oops!</h1>
        <p className="text-foreground">Sorry, an unexpected error has occurred.</p>
        <p className="flex gap-2 text-muted-foreground">
          <i className="font-bold">{error.status}:</i>
          <i>{error.statusText || error.message}</i>
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Verify (final whole-app gate)**

Run: `cd client && npm run lint && npm run build && npm run test`
Expected: lint clean; build succeeds; all tests pass (94 existing + HomePage 2 + DecksPage 2 = 98).
Run: `cd client && grep -rnE 'slate-|stone-|neutral-|gray-|(text|bg|border)-(red|blue|amber)-[0-9]|bg-white|bg-black' src --include=*.tsx | grep -v '__tests__' | grep -vE 'text-white"' || echo CLEAN`
Expected: `CLEAN` (no hardcoded chrome colors remain outside tests; the only allowed literal is `text-white` inside `button.tsx`'s destructive variant).

- [ ] **Step 6: Commit**

```bash
git add client/src/components/explore/ThemeCard.tsx client/src/components/explore/ExploreColor.tsx client/src/components/stats/ColorDistributionPieChart.tsx client/src/pages/ErrorPage.tsx
git commit -m "client: tokenize explore chrome, mana chart colors, and error page"
```

---

## Manual verification (after all tasks)

Run `cd client && npm run dev` (or `docker compose up`) and visually confirm on each screen: dark Obsidian background, gold primary buttons/accents, Cinzel headings + Inter body, no stray light/white panels. Check: Home hero + rails, Login/Register cards, Decks empty state + grid, a deck's DeckDetails tabs, Explore pages, and the color-distribution chart's mana colors.
