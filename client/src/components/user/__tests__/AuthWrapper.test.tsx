import { render, screen } from "@testing-library/react";
import AuthWrapper from "../AuthWrapper";
import { useUser } from "../useUser";

vi.mock("../useUser");
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }: any) => <div>redirect to {to}</div>,
}));

describe("AuthWrapper", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders children when authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: true });
    render(
      <AuthWrapper>
        <p>secret</p>
      </AuthWrapper>
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: false });
    render(
      <AuthWrapper>
        <p>secret</p>
      </AuthWrapper>
    );
    expect(screen.getByText("redirect to /login")).toBeInTheDocument();
  });
});
