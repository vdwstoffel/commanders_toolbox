# Card Detail Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tabbed, unpolished card-detail modal (opened by clicking a card already in a deck) with a single `AddCardDialog`-style view that also exposes change-printing, edit-quantity, and remove-from-deck controls.

**Architecture:** A new `CardDetailDialog` component mirrors `AddCardDialog`'s layout and styling. `CompactCardInfo` renders it inside the existing `OverlayWrapper`, dropping the `CustomTabs` + `FullCardInfo` + `ShowUniquePrintings` block. The dialog owns its own deck/scryfall hooks (like `AddCardDialog` owns `useAddCardToDeck`), so `CompactCardInfo` only passes data props and an `onClose` callback.

**Tech Stack:** React 19 + TypeScript, TanStack React Query, Tailwind v4 + shadcn/ui, Vitest + Testing Library (jsdom).

## Global Constraints

- Client formatting: Prettier `printWidth: 133`, `tabWidth: 2`.
- Prefer feature-local React Query hooks over calling API classes directly from components.
- In this codebase `cardDetails.card.id` IS the TCGplayer id (cards are keyed by TCGplayer id); it is the value passed as `originalId`/`cardId` to the deck mutation hooks and compared against a printing's `tcgplayer_id`.
- No server, DTO, or API-interface changes.
- `npm run lint` and `npm run test` must pass.

---

### Task 1: Create `CardDetailDialog` component

**Files:**
- Create: `client/src/components/decks/CardDetailDialog.tsx`
- Test: `client/src/components/decks/__tests__/CardDetailDialog.test.tsx`

**Interfaces:**
- Consumes (existing, already in the codebase):
  - `useRemoveCardFromDeck(): { removeCard: (a: { deckId: string|number; cardId: number; idToken: string }) => void }`
  - `useUpdateCardQuantity(): { updateCardQty: (a: { cardId: number; quantity: number }) => void }`
  - `useUpdateCardPrinting(): { updateCardPrinting: (a: { originalId: number; newCard: MagicCard }) => void }`
  - `useCardQuery(cardName: string)`, `usePrintingsQuery(oracleId?: string)`, `useCardByTcgIdQuery(tcgId?: number)` (React Query results with `{ data, isPending, error }`)
  - `useUser(): { idToken: string }`, `useParams(): { deckId?: string }`
  - `DeckCardDetails` from `@/api/backendDeckApi` (`{ id, card, deck, quantity, commander }`; `card.id` is a number, `card.cardName` a string).
- Produces: `default export function CardDetailDialog(props: { cardDetails: DeckCardDetails; quantity: number; onClose: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/decks/__tests__/CardDetailDialog.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CardDetailDialog from "../CardDetailDialog";
import { useParams } from "react-router-dom";
import { useRemoveCardFromDeck, useUpdateCardQuantity, useUpdateCardPrinting } from "../useDeckQuery";
import { useUser } from "../../user/useUser";
import { useCardQuery, usePrintingsQuery, useCardByTcgIdQuery } from "@/hooks/useScryfallQuery";

vi.mock("react-router-dom", () => ({ useParams: vi.fn() }));
vi.mock("../useDeckQuery");
vi.mock("../../user/useUser");
vi.mock("@/hooks/useScryfallQuery");
vi.mock("@/components/cards/CardFaceView", () => ({ default: ({ card }: any) => <div>{card.name}</div> }));
vi.mock("@/components/cards/Ruling", () => ({ default: () => <div>rulings</div> }));
vi.mock("@/components/cards/ManaCost", () => ({ default: () => <div>mana</div> }));

const scryfallCard = {
  name: "Sol Ring",
  oracle_id: "o1",
  tcgplayer_id: 1,
  mana_cost: "{1}",
  layout: "normal",
  rulings_uri: "r",
  prices: { eur: "1.50", usd: "2.00" },
} as any;

const printings = [
  { tcgplayer_id: 1, setName: "Set One", imageUrl: "one.jpg" },
  { tcgplayer_id: 2, setName: "Set Two", imageUrl: "two.jpg" },
];

function makeCardDetails(overrides = {}) {
  return { id: 10, card: { id: 1, cardName: "Sol Ring" }, deck: {}, quantity: 2, commander: false, ...overrides } as any;
}

describe("CardDetailDialog", () => {
  const removeCard = vi.fn();
  const updateCardQty = vi.fn();
  const updateCardPrinting = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ deckId: "123" });
    (useUser as jest.Mock).mockReturnValue({ idToken: "tok" });
    (useRemoveCardFromDeck as jest.Mock).mockReturnValue({ removeCard });
    (useUpdateCardQuantity as jest.Mock).mockReturnValue({ updateCardQty });
    (useUpdateCardPrinting as jest.Mock).mockReturnValue({ updateCardPrinting });
    (useCardQuery as jest.Mock).mockReturnValue({ data: scryfallCard, isPending: false, error: null });
    (usePrintingsQuery as jest.Mock).mockReturnValue({ data: printings });
    (useCardByTcgIdQuery as jest.Mock).mockReturnValue({ data: undefined });
  });

  function renderDialog(overrides = {}) {
    return render(<CardDetailDialog cardDetails={makeCardDetails(overrides)} quantity={2} onClose={onClose} />);
  }

  it("renders the card face, price pills, and current quantity", () => {
    renderDialog();
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.getByText(/1.50/)).toBeInTheDocument();
    expect(screen.getByText(/2.00/)).toBeInTheDocument();
    expect(screen.getByTestId("quantity")).toHaveTextContent("2");
  });

  it("renders one thumbnail per printing with the current printing highlighted", () => {
    renderDialog();
    expect(screen.getAllByTestId("printing-thumb")).toHaveLength(2);
    expect(screen.getByLabelText("Select printing: Set One")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Select printing: Set Two")).toHaveAttribute("aria-pressed", "false");
  });

  it("commits a printing change and closes once the chosen printing resolves", async () => {
    const newCard = { tcgplayer_id: 2, name: "Sol Ring 2" } as any;
    (useCardByTcgIdQuery as jest.Mock).mockReturnValue({ data: newCard });
    renderDialog();
    fireEvent.click(screen.getByLabelText("Select printing: Set Two"));
    expect(useCardByTcgIdQuery).toHaveBeenCalledWith(2);
    await waitFor(() => {
      expect(updateCardPrinting).toHaveBeenCalledWith({ originalId: 1, newCard });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("updates quantity via the + control", () => {
    renderDialog();
    fireEvent.click(screen.getByLabelText("increase quantity"));
    expect(screen.getByTestId("quantity")).toHaveTextContent("3");
    expect(updateCardQty).toHaveBeenCalledWith({ cardId: 1, quantity: 3 });
  });

  it("removes the card from the deck and closes", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Remove from deck/ }));
    expect(removeCard).toHaveBeenCalledWith({ deckId: "123", cardId: 1, idToken: "tok" });
    expect(onClose).toHaveBeenCalled();
  });

  it("hides quantity and remove controls for a commander", () => {
    renderDialog({ commander: true });
    expect(screen.queryByTestId("quantity")).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove from deck/ })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/components/decks/__tests__/CardDetailDialog.test.tsx`
Expected: FAIL — cannot resolve import `../CardDetailDialog` (module does not exist yet).

- [ ] **Step 3: Write the component**

Create `client/src/components/decks/CardDetailDialog.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import CardFaceView from "@/components/cards/CardFaceView";
import ManaCost from "@/components/cards/ManaCost";
import Rulings from "@/components/cards/Ruling";
import Loader from "@/components/ui/Loader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useRemoveCardFromDeck, useUpdateCardQuantity, useUpdateCardPrinting } from "./useDeckQuery";
import { useUser } from "../user/useUser";
import { useCardQuery, usePrintingsQuery, useCardByTcgIdQuery } from "@/hooks/useScryfallQuery";
import type { DeckCardDetails } from "@/api/backendDeckApi";

interface Props {
  cardDetails: DeckCardDetails;
  quantity: number;
  onClose: () => void;
}

export default function CardDetailDialog({ cardDetails, quantity, onClose }: Props) {
  const { deckId } = useParams();
  const { idToken } = useUser();
  const { removeCard } = useRemoveCardFromDeck();
  const { updateCardQty } = useUpdateCardQuantity();
  const { updateCardPrinting } = useUpdateCardPrinting();

  const currentTcgId = cardDetails.card.id;
  const isCommander = cardDetails.commander;

  const [selectedTcgId, setSelectedTcgId] = useState<number>(currentTcgId);
  const [qty, setQty] = useState<number>(quantity);

  const { data: card, isPending, error } = useCardQuery(cardDetails.card.cardName);
  const { data: printings } = usePrintingsQuery(card?.oracle_id);

  const isDifferentPrinting = selectedTcgId !== currentTcgId;
  const { data: printingCard } = useCardByTcgIdQuery(isDifferentPrinting ? selectedTcgId : undefined);

  // Commit a printing change once the chosen printing resolves, then close.
  useEffect(() => {
    if (!isDifferentPrinting || !printingCard || printingCard.tcgplayer_id !== selectedTcgId) return;
    updateCardPrinting({ originalId: currentTcgId, newCard: printingCard });
    onClose();
  }, [isDifferentPrinting, printingCard, selectedTcgId, currentTcgId, updateCardPrinting, onClose]);

  function changeQty(delta: number) {
    if (isCommander) return;
    const next = Math.min(99, Math.max(1, qty + delta));
    setQty(next);
    updateCardQty({ cardId: currentTcgId, quantity: next });
  }

  function removeHandler() {
    removeCard({ deckId: deckId!, cardId: currentTcgId, idToken });
    onClose();
  }

  if (isPending) return <Loader />;
  if (error || !card) return <ErrorMessage msg={error ? error.message : "Failed to fetch card data"} />;

  const eur = card.prices?.eur;
  const usd = card.prices?.usd;

  return (
    <div className="w-[min(90vw,700px)]">
      {isDifferentPrinting ? (
        <Loader />
      ) : (
        <>
          <CardFaceView card={card} />
          <div className="mt-3 flex items-center gap-3">
            <ManaCost mana_cost={card.mana_cost} />
            {eur && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">&euro; {eur}</span>}
            {usd && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">$ {usd}</span>}
          </div>
          <div className="mt-3">
            <Rulings rulingUri={card.rulings_uri} />
          </div>
        </>
      )}

      {printings && printings.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Printing — choose artwork</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {printings.map((p) => {
              const selected = p.tcgplayer_id === selectedTcgId;
              return (
                <button
                  key={p.tcgplayer_id}
                  type="button"
                  onClick={() => setSelectedTcgId(p.tcgplayer_id)}
                  aria-label={`Select printing: ${p.setName}`}
                  aria-pressed={selected}
                  className="w-[70px] flex-shrink-0 cursor-pointer text-left"
                >
                  <img
                    src={p.imageUrl}
                    alt={`${p.setName} printing`}
                    data-testid="printing-thumb"
                    className={`h-[98px] w-full rounded-md border-2 ${selected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                  />
                  <span className={`mt-1 block truncate text-center text-[10px] ${selected ? "text-primary" : "text-muted-foreground"}`}>
                    {p.setName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs font-bold text-primary">In deck: &times;{qty}</span>
        {!isCommander && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
              <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(-1)} aria-label="decrease quantity">
                &minus;
              </button>
              <span className="w-9 text-center font-bold" data-testid="quantity">
                {qty}
              </span>
              <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(1)} aria-label="increase quantity">
                +
              </button>
            </div>
            <Button variant="destructive" onClick={removeHandler}>
              Remove from deck
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/components/decks/__tests__/CardDetailDialog.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/decks/CardDetailDialog.tsx client/src/components/decks/__tests__/CardDetailDialog.test.tsx
git commit -m "client: add unified CardDetailDialog for in-deck cards"
```

---

### Task 2: Wire `CardDetailDialog` into `CompactCardInfo`

**Files:**
- Modify: `client/src/components/decks/CompactCardInfo.tsx`
- Test: `client/src/components/decks/__tests__/CompactCardInfo.test.tsx`

**Interfaces:**
- Consumes: `CardDetailDialog` from Task 1 (`{ cardDetails, quantity, onClose }`).
- Produces: unchanged public API — `CompactCardInfo({ cardDetails, quantity })`.

- [ ] **Step 1: Update the CompactCardInfo test for the new modal body**

In `client/src/components/decks/__tests__/CompactCardInfo.test.tsx`:

1. Replace the `CustomTabs`, `ShowUniquePrintings`, and `FullCardInfo` mocks (lines ~16–35) with a single mock for the new dialog:

```tsx
vi.mock('../CardDetailDialog', () => ({
  default: ({ cardDetails, onClose }: any) => (
    <div data-testid="card-detail-dialog">
      {cardDetails.card.cardName}
      <button data-testid="dialog-close" onClick={onClose} />
    </div>
  ),
}));
```

2. Delete the now-obsolete `mockNewCard` constant and the two tab-based tests `should switch tabs in overlay` and `should update card printing when setCardFn is called from ShowUniquePrintings` (lines ~137–179), since tabs and in-place printing selection no longer live in this component.

3. Replace the `should toggle card info overlay on card name click` test body so it asserts the dialog appears and closes:

```tsx
it('should toggle card info overlay on card name click', async () => {
  render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
  fireEvent.click(screen.getByText('Test Card'));
  await waitFor(() => expect(screen.getByTestId('card-detail-dialog')).toBeInTheDocument());
  fireEvent.click(screen.getByTestId('dialog-close'));
  await waitFor(() => expect(screen.queryByTestId('card-detail-dialog')).not.toBeInTheDocument());
});
```

The remaining tests (render, delete icon, quantity double-click editing on the row, commander guard) stay unchanged — the compact-row controls are not being removed.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/components/decks/__tests__/CompactCardInfo.test.tsx`
Expected: FAIL — `CompactCardInfo` still renders `CustomTabs`/`FullCardInfo`, so `card-detail-dialog` is not found (and the deleted mocks no longer match the rendered output).

- [ ] **Step 3: Update CompactCardInfo to render the dialog**

In `client/src/components/decks/CompactCardInfo.tsx`:

1. Remove these imports (lines 13–17):

```tsx
import FullCardInfo from "../cards/FullCardInfo";
import Tabs from "../ui/CustomTabs";
import ShowUniquePrintings from "../cards/ShowUniquePrintings";
import { type MagicCard } from "@/api/scryfallApi";
```

and add:

```tsx
import CardDetailDialog from "./CardDetailDialog";
```

(Keep the `OverlayWrapper` import.)

2. Remove the now-unused state and effect: the `activeTab` state (line 37), the `cardPrinting` state (line 39), and the entire printing-sync `useEffect` (lines 84–89). Remove the `useUpdateCardPrinting` hook usage (line 31) — printing changes now happen inside `CardDetailDialog`. Leave `useRemoveCardFromDeck` and `useUpdateCardQuantity` in place (still used by the compact row).

3. Replace the overlay body (lines 116–124):

```tsx
{showCardInfo && (
  <OverlayWrapper hideFn={toggleShowCardInfoHandler}>
    <CardDetailDialog cardDetails={cardDetails} quantity={quantity} onClose={toggleShowCardInfoHandler} />
  </OverlayWrapper>
)}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/components/decks/__tests__/CompactCardInfo.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run lint + full test suite**

Run: `cd client && npm run lint && npm run test:no-coverage`
Expected: lint clean; all tests pass. Fix any unused-import or type errors surfaced by the removals in Step 3.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/decks/CompactCardInfo.tsx client/src/components/decks/__tests__/CompactCardInfo.test.tsx
git commit -m "client: use CardDetailDialog for in-deck card modal"
```

---

## Notes / Manual verification

- Because the dev server proxies `/api` to host `server`, run the app under Docker Compose (`docker compose up --build`) to click a card in a deck and confirm: card face + price pills + rulings render, the printing strip highlights the current printing, selecting another printing swaps it and closes the modal, the −/+ updates the count, and Remove takes the card out. Commander cards should show neither the quantity controls nor Remove.
