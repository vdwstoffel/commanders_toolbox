import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";
import { useUser } from "@/components/user/useUser";

vi.mock("@/components/user/useUser");
vi.mock("react-router-dom", () => ({
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

describe("Navbar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a Login link when the user is not authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: false, logout: vi.fn() });
    render(<Navbar />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});
