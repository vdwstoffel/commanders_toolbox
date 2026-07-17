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
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addingCard: false, addCard: mockAddCard });
    (usePrintingsQuery as jest.Mock).mockReturnValue({ data: [] });
    (useCardByTcgIdQuery as jest.Mock).mockReturnValue({ data: undefined, isPending: false });
  });

  function renderDialog(overrides = {}) {
    return render(
      <AddCardDialog
        card={baseCard}
        deckColorIdentity="WUBRG"
        commanderNames={[]}
        deckCards={[]}
        onClose={mockOnClose}
        {...overrides}
      />
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
    expect(mockOnClose).toHaveBeenCalled();
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
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("blocks adding the commander", () => {
    renderDialog({ commanderNames: ["Sol Ring"] });
    expect(screen.getByText(/Cannot add the commander/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
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
