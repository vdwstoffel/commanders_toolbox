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
