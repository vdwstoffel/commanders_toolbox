import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../RegisterPage";
import { useUser } from "@/components/user/useUser";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  NavLink: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/components/user/useUser");

describe("RegisterPage", () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ register: mockRegister });
  });

  it("submits email and password then navigates to /decks", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith("a@b.com", "pw"));
    expect(mockNavigate).toHaveBeenCalledWith("/decks");
  });

  it("shows an error message when registration fails", async () => {
    mockRegister.mockRejectedValue(new Error("An account with this email already exists"));
    render(<RegisterPage />);

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(screen.getByText("An account with this email already exists")).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
