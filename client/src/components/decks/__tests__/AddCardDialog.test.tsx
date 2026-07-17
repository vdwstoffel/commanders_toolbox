import { render, screen, fireEvent } from "@testing-library/react";
import AddCardDialog from "../AddCardDialog";
import { useAddCardToDeck } from "../useDeckQuery";
import { usePrintingsQuery, useCardByTcgIdQuery } from "@/hooks/useScryfallQuery";

vi.mock("../useDeckQuery");
vi.mock("@/hooks/useScryfallQuery");
vi.mock("@/components/cards/CardFaceView", () => ({ default: ({ card }: any) => <div>{card.name}</div> }));
vi.mock("@/components/cards/Ruling", () => ({ default: () => <div>rulings</div> }));
vi.mock("@/components/cards/ManaCost", () => ({ default: () => <div>mana</div> }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectGroup: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

const baseCard = {
  name: "Sol Ring",
  oracle_id: "o1",
  tcgplayer_id: 1,
  mana_cost: "{1}",
  color_identity: [] as string[],
  rulings_uri: "r",
  prices: { eur: "1.50", usd: "2.00" },
} as any;

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
});
