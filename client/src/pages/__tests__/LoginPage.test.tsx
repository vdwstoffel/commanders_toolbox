import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { useUser } from "@/components/user/useUser";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  NavLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/user/useUser");

describe("LoginPage", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ login: mockLogin });
  });

  it("submits email and password then navigates to /decks", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("a@b.com", "pw"));
    expect(mockNavigate).toHaveBeenCalledWith("/decks");
  });

  it("shows an error message when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(screen.getByText("Invalid email or password")).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
