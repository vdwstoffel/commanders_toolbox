# Recommendations Card-Grid Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Recommendations tab's cramped text list + hover preview with a responsive card-art grid that shows real thumbnails, keeps owned cards visible-but-dimmed, and supports quick-add — using zero extra API calls to render thumbnails.

**Architecture:** EDHREC's cardview payload already carries a Scryfall card `id` plus `num_decks`/`potential_decks`. We build Scryfall CDN image URLs directly from that id (no API call) and compute a real inclusion %. The `CardRecomendations` component is rewritten from a 3-column text layout into a sidebar + card grid. Quick-add reuses the existing `useAddCardToDeck` mutation.

**Tech Stack:** React 19 + TypeScript, TanStack React Query, Tailwind CSS v4 + shadcn/ui, Vitest + Testing Library.

## Global Constraints

- Client formatting: Prettier `printWidth: 133`, `tabWidth: 2`.
- Lint must pass (`npm run lint`) — CI runs it.
- Tests colocated in `__tests__/`; run via Vitest.
- The component filename is `CardRecomendations.tsx` (existing spelling) — do not rename.
- Recommendations are purely client-side; no server change.
- Scryfall image URL pattern (verified HTTP 200): `https://cards.scryfall.io/{size}/front/{id[0]}/{id[1]}/{id}.jpg`.

---

### Task 1: Data-layer helpers + EDHREC type extension

**Files:**
- Modify: `client/src/api/scryfallApi.tsx` (add exported `scryfallImageFromId`)
- Modify: `client/src/api/edhRecApi.tsx:113-125` (extend cardview type, add `inclusionPercent`)
- Test: `client/src/api/__tests__/cardHelpers.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `scryfallImageFromId(id: string, size?: "small" | "normal" | "large"): string` — exported from `scryfallApi.tsx`.
  - `inclusionPercent(card: { num_decks?: number; potential_decks?: number }): number` — exported from `edhRecApi.tsx`.
  - Extended cardview type on `EdhDeckThemeStats.container.json_dict.cardlists[].cardviews[]`: `{ id?: string; name: string; synergy: number; num_decks?: number; potential_decks?: number }`.

- [ ] **Step 1: Write the failing test**

Create `client/src/api/__tests__/cardHelpers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scryfallImageFromId } from "@/api/scryfallApi";
import { inclusionPercent } from "@/api/edhRecApi";

describe("scryfallImageFromId", () => {
  it("builds a Scryfall CDN url from the card id, defaulting to normal size", () => {
    expect(scryfallImageFromId("6a5d8fad-2ffd-4645-8c49-907999b6cecf")).toBe(
      "https://cards.scryfall.io/normal/front/6/a/6a5d8fad-2ffd-4645-8c49-907999b6cecf.jpg",
    );
  });

  it("honours the requested size", () => {
    expect(scryfallImageFromId("6a5d8fad-2ffd-4645-8c49-907999b6cecf", "small")).toBe(
      "https://cards.scryfall.io/small/front/6/a/6a5d8fad-2ffd-4645-8c49-907999b6cecf.jpg",
    );
  });
});

describe("inclusionPercent", () => {
  it("returns rounded percentage of decks running the card", () => {
    expect(inclusionPercent({ num_decks: 56, potential_decks: 100 })).toBe(56);
    expect(inclusionPercent({ num_decks: 1, potential_decks: 3 })).toBe(33);
  });

  it("returns 0 when data is missing or potential_decks is 0", () => {
    expect(inclusionPercent({})).toBe(0);
    expect(inclusionPercent({ num_decks: 5, potential_decks: 0 })).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/api/__tests__/cardHelpers.test.ts`
Expected: FAIL — `scryfallImageFromId`/`inclusionPercent` are not exported.

- [ ] **Step 3: Add `scryfallImageFromId` to `scryfallApi.tsx`**

Append this exported function at the top level of `client/src/api/scryfallApi.tsx` (outside the class, e.g. just below the imports):

```ts
export function scryfallImageFromId(id: string, size: "small" | "normal" | "large" = "normal"): string {
  return `https://cards.scryfall.io/${size}/front/${id[0]}/${id[1]}/${id}.jpg`;
}
```

- [ ] **Step 4: Extend the cardview type and add `inclusionPercent` in `edhRecApi.tsx`**

In `client/src/api/edhRecApi.tsx`, change the `EdhDeckThemeStats.container` cardview shape (currently line ~124):

```ts
  container: {
    json_dict: {
      cardlists: {
        cardviews: { id?: string; name: string; synergy: number; num_decks?: number; potential_decks?: number }[];
        header: string;
      }[];
    };
  };
```

Then add this exported helper at the bottom of the file (after the interfaces):

```ts
export function inclusionPercent(card: { num_decks?: number; potential_decks?: number }): number {
  if (!card.potential_decks) return 0;
  return Math.round(((card.num_decks ?? 0) / card.potential_decks) * 100);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd client && npx vitest run src/api/__tests__/cardHelpers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Type-check**

Run: `cd client && npx tsc -b`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/api/scryfallApi.tsx client/src/api/edhRecApi.tsx client/src/api/__tests__/cardHelpers.test.ts
git commit -m "client: add scryfallImageFromId + inclusionPercent helpers for recommendations grid"
```

---

### Task 2: Rewrite CardRecommendations as a card grid with dimming + quick-add

**Files:**
- Modify: `client/src/components/decks/CardRecomendations.tsx` (full rewrite)
- Test: `client/src/components/decks/__tests__/CardRecomendations.test.tsx` (update)

**Interfaces:**
- Consumes: `scryfallImageFromId` (scryfallApi), `inclusionPercent` (edhRecApi), `useAddCardToDeck` returning `{ addCard, addingCard }` where `addCard({ card, quantity })`, `useEdhRecCommanderStats(commander, theme)` returning `{ isPending, error, recs }`, `useGetDeckById()` returning `{ deckById }`.
- Produces: the rewritten default-exported `CardRecommendations` component (props unchanged: `{ commander: string[]; theme: string }`).

- [ ] **Step 1: Update the test file to the new grid behavior**

Replace the body of `client/src/components/decks/__tests__/CardRecomendations.test.tsx` with (adds a `useAddCardToDeck` mock, replaces the hover-preview test with grid-image + dimming + quick-add tests):

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CardRecommendations from '../CardRecomendations';
import { useEdhRecCommanderStats, useGetDeckById, useAddCardToDeck } from '../useDeckQuery';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { getCardByName } = vi.hoisted(() => ({ getCardByName: vi.fn() }));

vi.mock('../useDeckQuery');
// Preserve the real scryfallImageFromId export (the component uses it) while making
// `new ScryfallApi()` return a stub. The implementation is baked in at mock time so it
// works even though the component instantiates ScryfallApi at module scope.
vi.mock('@/api/scryfallApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/scryfallApi')>();
  return { ...actual, ScryfallApi: vi.fn(() => ({ getCardByName })) };
});
vi.mock('../ui/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../ui/CustomTabs', () => ({
  default: ({ tabs, tabHandler }: any) => (
    <div role="tabs">
      {tabs.map((tab: string, index: number) => (
        <button key={tab} onClick={() => tabHandler(index)}>{tab}</button>
      ))}
    </div>
  ),
}));
vi.mock('../AddCardDialog', () => ({
  default: ({ card, onClose }: any) => (
    <div data-testid="add-card-dialog">
      {card.name}
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('CardRecommendations', () => {
  const addCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGetDeckById as jest.Mock).mockReturnValue({ deckById: [] });
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addCard, addingCard: false });
  });

  it('should display loader when pending', () => {
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: true, error: false, recs: [] });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display error message when there is an error', () => {
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: true, recs: [] });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    expect(screen.getByText('Could not load Card Recommendations')).toBeInTheDocument();
  });

  it('renders tabs and a grid tile per card with inclusion % and image', () => {
    const mockRecs = [
      {
        header: 'Tab 1',
        cardviews: [{ id: '6a5d8fad-2ffd-4645-8c49-907999b6cecf', name: 'Card A', synergy: 0.8, num_decks: 56, potential_decks: 100 }],
      },
      { header: 'Tab 2', cardviews: [{ name: 'Card B', synergy: 0.9 }] },
    ];
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });

    expect(screen.getByRole('tabs')).toBeInTheDocument();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Card A')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Card A' })).toHaveAttribute(
      'src',
      'https://cards.scryfall.io/normal/front/6/a/6a5d8fad-2ffd-4645-8c49-907999b6cecf.jpg',
    );
  });

  it('dims cards already in the deck and shows an "In deck" badge', () => {
    const mockRecs = [
      {
        header: 'Tab 1',
        cardviews: [
          { id: 'a1b2', name: 'Card A', synergy: 0.8 },
          { id: 'c3d4', name: 'Card B', synergy: 0.7 },
        ],
      },
    ];
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    (useGetDeckById as jest.Mock).mockReturnValue({
      deckById: [{ card: { cardName: 'Card A' }, deck: { colorIdentity: '' } }],
    });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    // Card B is not in the deck, so the grid renders; Card A shows the "In deck" badge.
    expect(screen.getByText('In deck')).toBeInTheDocument();
    expect(screen.getByText('Card B')).toBeInTheDocument();
  });

  it('quick-adds a card with quantity 1 when the + button is clicked', async () => {
    const mockRecs = [{ header: 'Tab 1', cardviews: [{ id: 'a1b2', name: 'Card A', synergy: 0.8 }] }];
    const mockCard = { name: 'Card A' } as any;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    getCardByName.mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Add Card A' }));

    await waitFor(() => expect(addCard).toHaveBeenCalledWith({ card: mockCard, quantity: 1 }));
    expect(screen.queryByTestId('add-card-dialog')).not.toBeInTheDocument();
  });

  it('opens the AddCardDialog with the clicked recommendation and closes it', async () => {
    const mockRecs = [{ header: 'Tab 1', cardviews: [{ id: 'a1b2', name: 'Card A', synergy: 0.8 }] }];
    const mockCard = { name: 'Card A', image_uris: { large: 'cardA.jpg' }, prices: { eur: '1.00', usd: '1.20' }, rulings_uri: 'r' } as any;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    getCardByName.mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByText('Card A'));

    await waitFor(() => expect(screen.getByTestId('add-card-dialog')).toBeInTheDocument());
    expect(screen.getByTestId('add-card-dialog')).toHaveTextContent('Card A');

    fireEvent.click(screen.getByText('close'));
    await waitFor(() => expect(screen.queryByTestId('add-card-dialog')).not.toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/components/decks/__tests__/CardRecomendations.test.tsx`
Expected: FAIL — component still renders the old text list / has no `+` button / `useAddCardToDeck` not imported.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `client/src/components/decks/CardRecomendations.tsx` with:

```tsx
import { useState } from "react";

import Tabs from "../ui/CustomTabs";

import { useEdhRecCommanderStats, useGetDeckById, useAddCardToDeck } from "./useDeckQuery";
import { ScryfallApi, scryfallImageFromId, type MagicCard } from "../../api/scryfallApi";
import { inclusionPercent } from "../../api/edhRecApi";
import Loader from "../ui/Loader";
import OverlayWrapper from "../ui/OverlayWrapper";
import AddCardDialog from "./AddCardDialog";

interface Props {
  commander: string[];
  theme: string;
}

const scryfallApi = new ScryfallApi();

export default function CardRecommendations({ commander, theme }: Props) {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const { isPending, error, recs } = useEdhRecCommanderStats(commander, theme);
  const { deckById } = useGetDeckById();
  const { addCard, addingCard } = useAddCardToDeck();
  const [selectedCard, setSelectedCard] = useState<MagicCard | undefined>(undefined);
  const [showCardInfoOverlay, setShowCardInfoOverlay] = useState<boolean>(false);
  const [addingCardName, setAddingCardName] = useState<string>("");

  if (isPending) return <Loader />;
  if (error) {
    return <h1 className="mt-10 text-center text-xl">Could not load Card Recommendations</h1>;
  }

  const tabs = recs?.map((rec) => rec.header);
  const recommendedCards = recs![activeTabIndex].cardviews;
  const cardsInDeck = deckById?.map((card) => card.card.cardName.split("//")[0].trim()); // only check the first name of double sided cards

  const sortedCards = [...recommendedCards].sort((a, b) => b.synergy - a.synergy);
  const allInDeck = sortedCards.length > 0 && sortedCards.every((card) => cardsInDeck?.includes(card.name));

  function activeTabHandler(index: number) {
    setActiveTabIndex(index);
  }

  async function onClickHandler(cardName: string) {
    try {
      const res = await scryfallApi.getCardByName(cardName);
      setSelectedCard(res);
      setShowCardInfoOverlay(true);
    } catch {
      /* ignore failed lookups */
    }
  }

  async function onQuickAdd(cardName: string) {
    setAddingCardName(cardName);
    try {
      const res = await scryfallApi.getCardByName(cardName);
      addCard({ card: res, quantity: 1 });
    } catch {
      /* ignore failed lookups */
    } finally {
      setAddingCardName("");
    }
  }

  function onOverlayClose() {
    setShowCardInfoOverlay(false);
  }

  return (
    <div className="mx-auto mt-10 flex max-w-6xl gap-6 px-4">
      <Tabs tabs={tabs} direction="col" tabHandler={activeTabHandler} activeTab={activeTabIndex} />
      <div className="max-h-[70vh] flex-1 overflow-auto">
        {allInDeck ? (
          <p className="mt-10 text-center text-sm text-neutral-400">All recommended cards are already in your deck.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedCards.map((card) => {
              const inDeck = cardsInDeck?.includes(card.name);
              return (
                <div
                  key={card.name}
                  className={`group relative cursor-pointer overflow-hidden rounded-lg transition ${
                    inDeck ? "opacity-40" : "hover:scale-105"
                  }`}
                  onClick={() => onClickHandler(card.name)}
                >
                  {card.id ? (
                    <img
                      src={scryfallImageFromId(card.id)}
                      alt={card.name}
                      loading="lazy"
                      className="aspect-[63/88] w-full rounded-lg object-cover"
                      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                    />
                  ) : (
                    <div className="flex aspect-[63/88] w-full items-center justify-center rounded-lg bg-neutral-800 p-2 text-center text-sm">
                      {card.name}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-2 py-1 text-xs">
                    <span className="truncate">{card.name}</span>
                    <span className="ml-1 shrink-0 font-semibold">{inclusionPercent(card)}%</span>
                  </div>

                  {inDeck ? (
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">In deck</span>
                  ) : (
                    <button
                      aria-label={`Add ${card.name}`}
                      className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-black group-hover:flex disabled:opacity-50"
                      disabled={addingCard && addingCardName === card.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAdd(card.name);
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCardInfoOverlay && selectedCard && (
        <OverlayWrapper hideFn={onOverlayClose}>
          <AddCardDialog
            card={selectedCard}
            deckColorIdentity={deckById?.[0]?.deck.colorIdentity ?? ""}
            commanderNames={commander}
            deckCards={deckById ?? []}
            onClose={onOverlayClose}
          />
        </OverlayWrapper>
      )}
    </div>
  );
}
```

Note: the `+` button is `hidden ... group-hover:flex`, so it is not in the accessibility tree until hover. jsdom ignores CSS visibility for `getByRole`, so the quick-add test still finds it — this matches Testing Library behavior. Do not change the class to work around the test.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/components/decks/__tests__/CardRecomendations.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Type-check and lint**

Run: `cd client && npx tsc -b && npx eslint src/components/decks/CardRecomendations.tsx`
Expected: no errors, no warnings.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/decks/CardRecomendations.tsx client/src/components/decks/__tests__/CardRecomendations.test.tsx
git commit -m "client: redesign Recommendations tab as a card-art grid with quick-add"
```

---

### Task 3: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full client test suite**

Run: `cd client && npm run test:no-coverage`
Expected: all tests pass.

- [ ] **Step 2: Lint the whole client**

Run: `cd client && npm run lint`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `cd client && npm run build`
Expected: `tsc -b` + Vite build succeed with no errors.

---

## Notes for the implementer

- The hover-preview image and the `hoveredCardImageUrl`/hover-timeout logic are intentionally removed — card art is now always inline in the grid, so no per-hover Scryfall call is needed.
- Sorting stays by `synergy` descending; the displayed headline % is **inclusion** (`inclusionPercent`), which is the "% of decks" figure EDHREC shows and is more meaningful than raw synergy for most tabs.
- `useAddCardToDeck` already invalidates `["deckById"]` and toasts on success/error — do not duplicate that here.
