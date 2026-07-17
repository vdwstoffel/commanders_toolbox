import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScryfallApi } from "@/api/scryfallApi";
import { useCardQuery } from "../useScryfallQuery";

vi.mock("@/api/scryfallApi");

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useScryfallQuery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("useCardQuery returns the fetched card and caches by name", async () => {
    const card = { name: "Sol Ring", oracle_id: "o1" };
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(card);
    const client = new QueryClient();

    const first = renderHook(() => useCardQuery("Sol Ring"), { wrapper: wrapper(client) });
    await waitFor(() => expect(first.result.current.data).toEqual(card));

    // second mount with the SAME client uses cache — no refetch
    renderHook(() => useCardQuery("Sol Ring"), { wrapper: wrapper(client) });
    expect(ScryfallApi.prototype.getCardByName).toHaveBeenCalledTimes(1);
  });

  it("useCardQuery does not fetch when name is empty", () => {
    const client = new QueryClient();
    renderHook(() => useCardQuery(""), { wrapper: wrapper(client) });
    expect(ScryfallApi.prototype.getCardByName).not.toHaveBeenCalled();
  });
});
