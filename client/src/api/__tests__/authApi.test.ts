import axios from "axios";
import { AuthApi } from "../authApi";

vi.mock("axios");

describe("AuthApi", () => {
  const api = new AuthApi();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register posts credentials and returns the token", async () => {
    (axios.post as any).mockResolvedValue({ data: { token: "tok-1" } });

    const token = await api.register("a@b.com", "pw");

    expect(token).toBe("tok-1");
    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", { email: "a@b.com", password: "pw" });
  });

  it("login posts credentials and returns the token", async () => {
    (axios.post as any).mockResolvedValue({ data: { token: "tok-2" } });

    const token = await api.login("a@b.com", "pw");

    expect(token).toBe("tok-2");
    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", { email: "a@b.com", password: "pw" });
  });

  it("login throws the server message on failure", async () => {
    (axios.post as any).mockRejectedValue({ response: { data: { message: "Invalid email or password" } } });

    await expect(api.login("a@b.com", "wrong")).rejects.toThrow("Invalid email or password");
  });
});
