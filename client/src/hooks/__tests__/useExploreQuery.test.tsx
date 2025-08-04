import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useGetCommandersByColor,
  useGetCardsByTheme,
  useGetThemesOverview,
  useGetTopCommanders,
} from "../useExploreQuery";
import { EdhRecApi } from "@/api/edhRecApi";
import { BackendExploreAPI } from "@/api/backendExploreApi";
import { ScryfallApi } from "@/api/scryfallApi";

vi.mock("@/api/edhRecApi");
vi.mock("@/api/backendExploreApi");
vi.mock("@/api/scryfallApi");

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
describe("useGetTopCommanders", () => {
  it("should return top commanders", async () => {
    const mockTopCommanderData = [{ name: "Atraxa, Praetors' Voice" }];
    const mockCardInfo = [{ name: "Atraxa, Praetors' Voice", image_uris: { large: "" } }];
    (EdhRecApi.prototype.getTopCommander as jest.Mock).mockResolvedValue(mockTopCommanderData);
    (BackendExploreAPI.prototype.getBatchCardInfo as jest.Mock).mockResolvedValue(mockCardInfo);
    const { result } = renderHook(() => useGetTopCommanders("week"), { wrapper });
    await waitFor(() => expect(result.current.isLoadingTopCommander).toBe(false));
    expect(result.current.topCommanderData).toEqual(mockCardInfo);
    expect(result.current.topCommanderError).toBe(null);
  });
});

describe("useGetCommandersByColor", () => {
  it("should return commanders by color", async () => {
    const mockEdhData = [{ name: "Sidar Kondo of Jamuraa // Tymna the Weaver" }];
    const mockCardInfo = [
      { name: "Sidar Kondo of Jamuraa", image_uris: { large: "" } },
      { name: "Tymna the Weaver", image_uris: { large: "" } },
    ];

    (EdhRecApi.prototype.getCommanderByColor as jest.Mock).mockResolvedValue(mockEdhData);
    (ScryfallApi.prototype.getCollection as jest.Mock).mockResolvedValue(mockCardInfo);

    const { result } = renderHook(() => useGetCommandersByColor("wg"), { wrapper });

    await waitFor(() => expect(result.current.waitingForCommanderByColor).toBe(false));

    expect(result.current.commanderColorInfo).toEqual([[
      { name: "Sidar Kondo of Jamuraa", cardImage: "" },
      { name: "Tymna the Weaver", cardImage: "" },
    ]]);
    expect(result.current.commanderByColorError).toBe(null);
  });
});

describe("useGetThemesOverview", () => {
  it("should return themes overview", async () => {
    const mockThemes = [{ name: "Test Theme", count: 100 }];
    (EdhRecApi.prototype.getThemeOrTribeOverview as jest.Mock).mockResolvedValue(mockThemes);

    const { result } = renderHook(() => useGetThemesOverview("themes"), { wrapper });

    await waitFor(() => expect(result.current.isPendingThemesOverview).toBe(false));

    expect(result.current.themesOverview).toEqual(mockThemes);
    expect(result.current.themesOverviewError).toBe(null);
  });
});

describe("useGetCardsByTheme", () => {
  it("should return cards by theme", async () => {
    const mockEdhData = [{ name: "Test Card" }];
    const mockCardInfo = [{ name: "Test Card", image_uris: { large: "" } }];

    (EdhRecApi.prototype.getThemeOrTribeCards as jest.Mock).mockResolvedValue(mockEdhData);
    (ScryfallApi.prototype.getCollection as jest.Mock).mockResolvedValue(mockCardInfo);

    const { result } = renderHook(() => useGetCardsByTheme("Test Theme"), { wrapper });

    await waitFor(() => expect(result.current.isWaitingForCardsByTheme).toBe(false));

    expect(result.current.cardsByTheme).toEqual([[{ name: "Test Card", cardImage: "" }]]);
    expect(result.current.cardsByThemeError).toBe(null);
  });
});
