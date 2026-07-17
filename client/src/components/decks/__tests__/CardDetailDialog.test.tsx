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

  it("rulings are hidden until the toggle button is clicked", () => {
    renderDialog();
    expect(screen.queryByText("rulings")).toBeNull();
    fireEvent.click(screen.getByText(/Rulings/));
    expect(screen.getByText("rulings")).toBeInTheDocument();
  });
});
