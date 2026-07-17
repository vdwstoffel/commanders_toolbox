# AddCardDialog artwork picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the set-name `Select` in `AddCardDialog` with an always-visible, horizontally-scrollable strip of printing-artwork thumbnails — fixing the modal-close bug (the `Select`'s portal) and letting the user pick a printing by its artwork.

**Architecture:** Single-component change. `AddCardDialog` already fetches printings (`usePrintingsQuery` → `PrintingData[]` with `imageUrl`/`setName`/`tcgplayer_id`) and swaps the displayed/added card via `selectedTcgId` + `useCardByTcgIdQuery`. We only change the *presentation* of the picker: remove the shadcn `Select` (a `document.body` portal that OverlayWrapper's outside-click listener mistook for an outside click), and render clickable artwork thumbnails that call `setSelectedTcgId`. No new data/fetch logic.

**Tech Stack:** React 19 + TS, Tailwind v4 + shadcn/ui, Vitest + React Testing Library.

## Global Constraints

- Client: Prettier `printWidth: 133`, 2-space indent. Vitest globals ENABLED — do NOT import `describe`/`it`/`expect`/`vi` (existing tests use `(x as jest.Mock)` casts). `@` → `client/src`.
- Dark theme tokens only (`bg-muted`, `border-border`, `border-primary`, `text-primary`, `text-muted-foreground`) — no hardcoded chrome colors.
- `PrintingData` = `{ tcgplayer_id: number; setName: string; imageUrl: string }`.
- The artwork strip renders only when `printings && printings.length > 1`; it sits BELOW the card details/rulings and ABOVE the sticky action bar, and stays visible even while a newly-selected printing loads.
- Preserve the existing AddCardDialog behaviour: price chips, mana pips, collapsible rulings, in-deck count, quantity stepper (clamp 1–99), gold Add button (disabled + "Adding…" when pending/blocked), inline off-color/commander validation, Add payload `{ card: displayCard, quantity }`.
- Commits: short, plain messages, NO `Co-Authored-By` trailer. Branch: `artwork-picker`.
- Gate: `cd client && npm run lint && npm run build && npm run test` (preserve the full 108-test suite).

---

## Task 1: Replace the printing Select with an artwork thumbnail strip

**Files:**
- Modify: `client/src/components/decks/AddCardDialog.tsx` (remove `Select`, add artwork strip)
- Test: `client/src/components/decks/__tests__/AddCardDialog.test.tsx` (drop the Select mock; add strip tests; keep existing)

**Interfaces:**
- Consumes (unchanged, already present): `usePrintingsQuery(oracleId)` → `{ data?: PrintingData[] }`; `useCardByTcgIdQuery(tcgId | undefined)`; `useAddCardToDeck()` → `{ addingCard, addCard }`.
- Produces: an artwork strip where each printing is a `<button aria-label="Select printing: {setName}">` wrapping an `<img data-testid="printing-thumb">` + set caption; clicking sets `selectedTcgId`.

- [ ] **Step 1: Update the test file** `client/src/components/decks/__tests__/AddCardDialog.test.tsx` — remove the `@/components/ui/select` mock, and add a shared `printings` fixture + two strip tests. Replace the whole file with:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import AddCardDialog from "../AddCardDialog";
import { useAddCardToDeck } from "../useDeckQuery";
import { usePrintingsQuery, useCardByTcgIdQuery } from "@/hooks/useScryfallQuery";

vi.mock("../useDeckQuery");
vi.mock("@/hooks/useScryfallQuery");
vi.mock("@/components/cards/CardFaceView", () => ({ default: ({ card }: any) => <div>{card.name}</div> }));
vi.mock("@/components/cards/Ruling", () => ({ default: () => <div>rulings</div> }));
vi.mock("@/components/cards/ManaCost", () => ({ default: () => <div>mana</div> }));

const baseCard = {
  name: "Sol Ring",
  oracle_id: "o1",
  tcgplayer_id: 1,
  mana_cost: "{1}",
  color_identity: [] as string[],
  rulings_uri: "r",
  prices: { eur: "1.50", usd: "2.00" },
} as any;

const printings = [
  { tcgplayer_id: 1, setName: "Set One", imageUrl: "one.jpg" },
  { tcgplayer_id: 2, setName: "Set Two", imageUrl: "two.jpg" },
];

describe("AddCardDialog", () => {
  const mockAddCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addingCard: false, addCard: mockAddCard });
    (usePrintingsQuery as jest.Mock).mockReturnValue({ data: [] });
    (useCardByTcgIdQuery as jest.Mock).mockReturnValue({ data: undefined, isPending: false });
  });

  function renderDialog(overrides = {}) {
    return render(
      <AddCardDialog card={baseCard} deckColorIdentity="WUBRG" commanderNames={[]} deckCards={[]} {...overrides} />
    );
  }

  it("renders the card, price chips, and quantity", () => {
    renderDialog();
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.getByText(/1.50/)).toBeInTheDocument();
    expect(screen.getByText(/2.00/)).toBeInTheDocument();
    expect(screen.getByTestId("quantity")).toHaveTextContent("1");
  });

  it("increments and clamps quantity, and adds the card with the chosen quantity", () => {
    renderDialog();
    fireEvent.click(screen.getByLabelText("increase quantity"));
    expect(screen.getByTestId("quantity")).toHaveTextContent("2");
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).toHaveBeenCalledWith({ card: baseCard, quantity: 2 });
  });

  it("shows the in-deck count from deckCards", () => {
    renderDialog({ deckCards: [{ card: { cardName: "Sol Ring" }, quantity: 3 }] });
    expect(screen.getByText(/In deck: .*3/)).toBeInTheDocument();
  });

  it("blocks an off-color card and does not add", () => {
    renderDialog({ card: { ...baseCard, color_identity: ["B"] }, deckColorIdentity: "WUG" });
    expect(screen.getByText(/not in the deck's color identity/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).not.toHaveBeenCalled();
  });

  it("blocks adding the commander", () => {
    renderDialog({ commanderNames: ["Sol Ring"] });
    expect(screen.getByText(/Cannot add the commander/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).not.toHaveBeenCalled();
  });

  it("does not render the printing strip when there is one or zero printings", () => {
    renderDialog();
    expect(screen.queryByTestId("printing-thumb")).toBeNull();
  });

  it("renders one artwork thumbnail per printing with its set caption", () => {
    (usePrintingsQuery as jest.Mock).mockReturnValue({ data: printings });
    renderDialog();
    expect(screen.getAllByTestId("printing-thumb")).toHaveLength(2);
    expect(screen.getByText("Set One")).toBeInTheDocument();
    expect(screen.getByText("Set Two")).toBeInTheDocument();
  });

  it("selects a printing when its artwork is clicked", () => {
    (usePrintingsQuery as jest.Mock).mockReturnValue({ data: printings });
    renderDialog();
    fireEvent.click(screen.getByLabelText("Select printing: Set Two"));
    expect(useCardByTcgIdQuery).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 2: Run the test to verify the new strip tests fail**

Run: `cd client && npx vitest run src/components/decks/__tests__/AddCardDialog.test.tsx`
Expected: FAIL — `renders one artwork thumbnail per printing…` and `selects a printing when its artwork is clicked` fail (no `printing-thumb` elements yet; the old code still renders a `Select` for >1 printing). The other 5 tests pass.

- [ ] **Step 3: Rewrite `client/src/components/decks/AddCardDialog.tsx`** — remove the `Select` import + JSX, and add the artwork strip. Full file:

```tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";
import CardFaceView from "@/components/cards/CardFaceView";
import ManaCost from "@/components/cards/ManaCost";
import Rulings from "@/components/cards/Ruling";
import Loader from "@/components/ui/Loader";
import { useAddCardToDeck } from "./useDeckQuery";
import { useCardByTcgIdQuery, usePrintingsQuery } from "@/hooks/useScryfallQuery";
import type { MagicCard } from "@/api/scryfallApi";
import type { DeckCardDetails } from "@/api/backendDeckApi";

interface Props {
  card: MagicCard;
  deckColorIdentity: string;
  commanderNames: string[];
  deckCards: DeckCardDetails[];
}

export default function AddCardDialog({ card, deckColorIdentity, commanderNames, deckCards }: Props) {
  const { addingCard, addCard } = useAddCardToDeck();
  const [selectedTcgId, setSelectedTcgId] = useState<number | undefined>(card.tcgplayer_id);
  const [quantity, setQuantity] = useState(1);
  const [showRulings, setShowRulings] = useState(false);

  const { data: printings } = usePrintingsQuery(card.oracle_id);
  const isDifferentPrinting = !!selectedTcgId && selectedTcgId !== card.tcgplayer_id;
  const { data: printingCard, isPending: loadingPrinting } = useCardByTcgIdQuery(isDifferentPrinting ? selectedTcgId : undefined);
  const displayCard: MagicCard = isDifferentPrinting && printingCard ? printingCard : card;

  const inDeckCount = deckCards
    .filter((dc) => dc.card.cardName === displayCard.name)
    .reduce((sum, dc) => sum + dc.quantity, 0);

  const offColor = displayCard.color_identity.some((c) => !deckColorIdentity.includes(c));
  const isCommander = commanderNames.includes(displayCard.name);
  const blockedReason = offColor
    ? `${displayCard.name} is not in the deck's color identity`
    : isCommander
      ? "Cannot add the commander to the deck"
      : null;

  function changeQty(delta: number) {
    setQuantity((q) => Math.min(99, Math.max(1, q + delta)));
  }

  function addHandler() {
    if (blockedReason) return;
    addCard({ card: displayCard, quantity });
    setQuantity(1);
  }

  const eur = displayCard.prices?.eur;
  const usd = displayCard.prices?.usd;

  return (
    <div className="w-[min(90vw,700px)]">
      {isDifferentPrinting && loadingPrinting ? (
        <Loader />
      ) : (
        <>
          <CardFaceView card={displayCard} />
          <div className="mt-3 flex items-center gap-3">
            <ManaCost mana_cost={displayCard.mana_cost} />
            {eur && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">&euro; {eur}</span>}
            {usd && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">$ {usd}</span>}
          </div>
          <div className="mt-3">
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowRulings((s) => !s)}
            >
              {showRulings ? "▾" : "▸"} Rulings
            </button>
            {showRulings && <Rulings rulingUri={displayCard.rulings_uri} />}
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

      {blockedReason && <p className="mt-3 font-bold text-destructive">{blockedReason}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs font-bold text-primary">
          {inDeckCount > 0 ? `In deck: ×${inDeckCount}` : "Not in deck"}
        </span>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
            <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(-1)} aria-label="decrease quantity">
              &minus;
            </button>
            <span className="w-9 text-center font-bold" data-testid="quantity">
              {quantity}
            </span>
            <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(1)} aria-label="increase quantity">
              +
            </button>
          </div>
          <Button onClick={addHandler} disabled={!!blockedReason || addingCard}>
            {addingCard ? "Adding…" : "+ Add to Deck"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/components/decks/__tests__/AddCardDialog.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Run the full gate**

Run: `cd client && npm run lint && npm run build && npm run test`
Expected: lint clean; `tsc -b && vite build` succeeds; full suite passes (was 108; +3 new AddCardDialog cases → 111; no `@/components/ui/select` references remain in AddCardDialog).

- [ ] **Step 6: Commit**

```bash
git add client/src/components/decks/AddCardDialog.tsx client/src/components/decks/__tests__/AddCardDialog.test.tsx
git commit -m "client: replace printing dropdown with artwork thumbnail picker (fixes modal-close)"
```

---

## Manual verification (after the task)

Run `cd client && npm run dev` (or `docker compose up`), open a deck, search a multi-printing card (e.g. Sol Ring): the dialog shows an artwork strip under the card; clicking a thumbnail swaps the displayed art/prices and the gold ring moves to it; the modal stays open throughout (no more close-on-click); adding uses the selected printing.
