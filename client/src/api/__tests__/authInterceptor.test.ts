import { onResponseError } from "../authInterceptor";

describe("onResponseError", () => {
  const removeItem = vi.spyOn(Storage.prototype, "removeItem");

  beforeEach(() => {
    removeItem.mockClear();
    Object.defineProperty(window, "location", {
      value: { assign: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  it("clears idToken and redirects to /login on 401 for own-backend URLs", async () => {
    const error = { response: { status: 401 }, config: { url: "/api/v1/decks" } };

    await expect(onResponseError(error)).rejects.toBe(error);

    expect(removeItem).toHaveBeenCalledWith("idToken");
    expect(window.location.assign).toHaveBeenCalledWith("/login");
  });

  it("does NOT clear token or redirect on 401 for external absolute URLs", async () => {
    const error = { response: { status: 401 }, config: { url: "https://api.scryfall.com/cards" } };

    await expect(onResponseError(error)).rejects.toBe(error);

    expect(removeItem).not.toHaveBeenCalled();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("does NOT clear token or redirect on 500 errors for own-backend URLs", async () => {
    const error = { response: { status: 500 }, config: { url: "/api/v1/decks" } };

    await expect(onResponseError(error)).rejects.toBe(error);

    expect(removeItem).not.toHaveBeenCalled();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
