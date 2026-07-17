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
    expect(screen.getAllByTestId("carousel")).toHaveLength(2);
  });

  it("navigates to new-deck when Create a Deck is clicked", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Create a Deck" }));
    expect(mockNavigate).toHaveBeenCalledWith("/decks/new-deck");
  });
});
