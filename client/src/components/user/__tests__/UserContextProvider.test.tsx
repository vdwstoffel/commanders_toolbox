import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserContextProvider from "../UserContextProvider";
import { useUser } from "../useUser";
import { AuthApi } from "@/api/authApi";

vi.mock("@/api/authApi");

function makeToken(expSeconds: number) {
  const payload = btoa(JSON.stringify({ sub: "u1", exp: expSeconds }));
  return `header.${payload}.sig`;
}

function Consumer() {
  const { isAuthenticated, idToken, login, logout } = useUser();
  return (
    <div>
      <p data-testid="auth">{isAuthenticated ? "yes" : "no"}</p>
      <p data-testid="token">{idToken}</p>
      <button onClick={() => login("a@b.com", "pw")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("UserContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts unauthenticated when no token is stored", () => {
    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>
    );
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
  });

  it("stores the token and becomes authenticated after login", async () => {
    const token = makeToken(Math.floor(Date.now() / 1000) + 3600);
    (AuthApi.prototype.login as any).mockResolvedValue(token);

    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>
    );
    fireEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("yes"));
    expect(localStorage.getItem("idToken")).toBe(token);
  });

  it("logout clears the token", async () => {
    const token = makeToken(Math.floor(Date.now() / 1000) + 3600);
    (AuthApi.prototype.login as any).mockResolvedValue(token);

    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>
    );
    fireEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("yes"));

    fireEvent.click(screen.getByText("logout"));
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(localStorage.getItem("idToken")).toBeNull();
  });
});
