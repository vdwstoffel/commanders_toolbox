import axios from "axios";
import { EdhRecApi, ColorIdentity } from "./edhRecApi";
import { axiosErrorWrapper } from "./apiHelpers";

// Mock axios and apiHelpers
jest.mock("axios");
jest.mock("./apiHelpers");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAxiosErrorWrapper = axiosErrorWrapper as jest.MockedFunction<typeof axiosErrorWrapper>;

describe("EdhRecApi", () => {
  let api: EdhRecApi;

  beforeEach(() => {
    api = new EdhRecApi();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct base URLs", () => {
      expect(api["base_url"]).toBe("https://json.edhrec.com/pages/commanders");
      expect(api["tags_url"]).toBe("https://json.edhrec.com/pages/tags");
    });
  });

  describe("slugify", () => {
    it("should handle single commander with double-faced card", () => {
      const result = api.slugify(["Jace, Vryn's Prodigy // Jace, Telepath Unbound"]);
      expect(result).toBe("jace-vryns-prodigy");
    });

    it("should handle single commander without double-faced card", () => {
      const result = api.slugify(["Korvold, Fae-Cursed King"]);
      expect(result).toBe("korvold-fae-cursed-king");
    });

    it("should handle multiple commanders", () => {
      const result = api.slugify(["Sakashima", "Krark, the Thumbless"]);
      expect(result).toBe("sakashima-krark-the-thumbless");
    });

    it("should handle names with special characters", () => {
      const result = api.slugify(["Atraxa, Praetors' Voice"]);
      expect(result).toBe("atraxa-praetors-voice");
    });

    it("should handle names with extra whitespace", () => {
      const result = api.slugify(["  Edgar Markov  "]);
      expect(result).toBe("edgar-markov");
    });

    it("should handle names with multiple spaces", () => {
      const result = api.slugify(["The     Ur-Dragon"]);
      expect(result).toBe("the-ur-dragon");
    });

    it("should handle names with numbers", () => {
      const result = api.slugify(["Ghalta, Primal Hunger"]);
      expect(result).toBe("ghalta-primal-hunger");
    });

    it("should handle empty array", () => {
      const result = api.slugify([]);
      expect(result).toBe("");
    });

    it("should handle array with empty string", () => {
      const result = api.slugify([""]);
      expect(result).toBe("");
    });

    it("should handle names with consecutive dashes", () => {
      const result = api.slugify(["Test--Commander"]);
      expect(result).toBe("test-commander");
    });

    it("should handle names with mixed case and punctuation", () => {
      const result = api.slugify(["Zur the Enchanter!"]);
      expect(result).toBe("zur-the-enchanter");
    });
  });

  describe("getDeckStatsByTheme", () => {
    const mockStats = {
      creature: 30,
      instant: 8,
      sorcery: 10,
      artifact: 5,
      enchantment: 3,
      battle: 0,
      planeswalker: 2,
      land: 37,
      basic: 15,
      nonbasic: 22,
      container: {
        json_dict: {
          cardlists: [{
            cardviews: [{ name: "Sol Ring", synergy: 0.5 }],
            header: "High Synergy Cards"
          }]
        }
      }
    };

    it("should fetch deck stats for custom theme", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await api.getDeckStatsByTheme(["Edgar Markov"], "custom");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/edgar-markov.json");
      expect(result).toEqual(mockStats);
    });

    it("should fetch deck stats for specific theme", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockStats });

      const result = await api.getDeckStatsByTheme(["Edgar Markov"], "vampires");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/edgar-markov/vampires.json");
      expect(result).toEqual(mockStats);
    });

    it("should handle uppercase theme names", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockStats });

      await api.getDeckStatsByTheme(["Edgar Markov"], "VAMPIRES");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/edgar-markov/vampires.json");
    });

    it("should handle multiple commanders", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockStats });

      await api.getDeckStatsByTheme(["Sakashima", "Krark"], "spellslinger");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/sakashima-krark/spellslinger.json");
    });

    it("should propagate axios errors", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await expect(api.getDeckStatsByTheme(["Edgar Markov"], "vampires")).rejects.toThrow("Network error");
    });
  });

  describe("getDeckThemes", () => {
    const mockThemesResponse = {
      panels: {
        taglinks: [
          { count: 100, value: "Vampires", slug: "vampires" },
          { count: 50, value: "Aristocrats", slug: "aristocrats" }
        ]
      }
    };

    it("should fetch deck themes successfully", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockThemesResponse });

      const result = await api.getDeckThemes(["Edgar Markov"]);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/edgar-markov.json");
      expect(result).toEqual(mockThemesResponse.panels.taglinks);
    });

    it("should return null on error", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await api.getDeckThemes(["Edgar Markov"]);

      expect(result).toBeNull();
    });

    it("should handle multiple commanders", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockThemesResponse });

      await api.getDeckThemes(["Sakashima", "Krark"]);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/sakashima-krark.json");
    });

    it("should handle double-faced cards", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockThemesResponse });

      await api.getDeckThemes(["Jace, Vryn's Prodigy // Jace, Telepath Unbound"]);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/jace-vryns-prodigy.json");
    });
  });

  describe("getCommanders", () => {
    const mockCommandersResponse = {
      container: {
        json_dict: {
          cardlists: [{
            cardviews: [
              { name: "Edgar Markov", url: "/commanders/edgar-markov" },
              { name: "Atraxa", url: "/commanders/atraxa" }
            ],
            header: "Commanders"
          }]
        }
      }
    };

    it("should fetch commanders successfully", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      const result = await api.getCommanders("vampires");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/vampires.json");
      expect(result).toEqual(mockCommandersResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should handle axios errors with error wrapper", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await api.getCommanders("vampires");

      expect(mockedAxiosErrorWrapper).toHaveBeenCalledWith(error);
    });

    it("should handle empty keyword", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      await api.getCommanders("");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/.json");
    });

    it("should handle special characters in keyword", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      await api.getCommanders("spell-slinger");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/spell-slinger.json");
    });
  });

  describe("getTopCommander", () => {
    const mockCommandersResponse = {
      container: {
        json_dict: {
          cardlists: [{
            cardviews: [{ name: "Edgar Markov", url: "/commanders/edgar-markov" }],
            header: "Top Commanders"
          }]
        }
      }
    };

    it("should fetch top commanders for year", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      const result = await api.getTopCommander("year");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/year.json");
      expect(result).toEqual(mockCommandersResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should fetch top commanders for month", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      const result = await api.getTopCommander("month");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/month.json");
      expect(result).toEqual(mockCommandersResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should fetch top commanders for week", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      const result = await api.getTopCommander("week");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/week.json");
      expect(result).toEqual(mockCommandersResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should handle errors through getCommanders", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await api.getTopCommander("year");

      expect(mockedAxiosErrorWrapper).toHaveBeenCalledWith(error);
    });
  });

  describe("getCommanderByColor", () => {
    const mockCommandersResponse = {
      container: {
        json_dict: {
          cardlists: [{
            cardviews: [{ name: "Edgar Markov", url: "/commanders/edgar-markov" }],
            header: "Commanders"
          }]
        }
      }
    };

    it("should fetch commanders by mono-white color", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      const result = await api.getCommanderByColor("mono-white");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/mono-white.json");
      expect(result).toEqual(mockCommandersResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should fetch commanders by five-color", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      await api.getCommanderByColor("five-color");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/five-color.json");
    });

    it("should fetch commanders by guild colors", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      await api.getCommanderByColor("azorius");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/azorius.json");
    });

    it("should fetch commanders by shard colors", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCommandersResponse });

      await api.getCommanderByColor("esper");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/commanders/esper.json");
    });

    it("should handle errors through getCommanders", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await api.getCommanderByColor("mono-blue");

      expect(mockedAxiosErrorWrapper).toHaveBeenCalledWith(error);
    });
  });

  describe("getThemeOrTribeOverview", () => {
    const mockOverviewResponse = {
      container: {
        json_dict: {
          cardlists: [{
            cardviews: [{ name: "Vampire Token", url: "/cards/vampire-token" }],
            header: "Overview"
          }]
        }
      }
    };

    it("should fetch theme overview successfully", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockOverviewResponse });

      const result = await api.getThemeOrTribeOverview("vampires");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/tags/vampires.json");
      expect(result).toEqual(mockOverviewResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should fetch tribe overview successfully", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockOverviewResponse });

      const result = await api.getThemeOrTribeOverview("elves");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/tags/elves.json");
      expect(result).toEqual(mockOverviewResponse.container.json_dict.cardlists[0].cardviews);
    });

    it("should handle errors with error wrapper", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await api.getThemeOrTribeOverview("vampires");

      expect(mockedAxiosErrorWrapper).toHaveBeenCalledWith(error);
    });

    it("should handle empty theme/tribe string", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockOverviewResponse });

      await api.getThemeOrTribeOverview("");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/tags/.json");
    });

    it("should handle special characters in theme/tribe", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockOverviewResponse });

      await api.getThemeOrTribeOverview("spell-slinger");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/tags/spell-slinger.json");
    });
  });

  describe("getThemeOrTribeCards", () => {
    const mockCardsResponse = {
      container: {
        json_dict: {
          cardlists: [
            {
              cardviews: [{ name: "New Card", url: "/cards/new-card" }],
              header: "New Cards"
            },
            {
              cardviews: [
                { name: "Edgar Markov", url: "/commanders/edgar-markov" },
                { name: "Atraxa", url: "/commanders/atraxa" }
              ],
              header: "Top Commanders"
            }
          ]
        }
      }
    };

    it("should fetch theme cards and return top commanders", async () => {
      mockedAxios.get.mockResolvedValue({ data: mockCardsResponse });

      const result = await api.getThemeOrTribeCards("vampires");

      expect(mockedAxios.get).toHaveBeenCalledWith("https://json.edhrec.com/pages/tags/vampires.json");
      expect(result).toEqual(mockCardsResponse.container.json_dict.cardlists[1].cardviews);
    });

    it("should handle response without Top Commanders section", async () => {
      const responseWithoutTopCommanders = {
        container: {
          json_dict: {
            cardlists: [
              {
                cardviews: [{ name: "Card 1", url: "/cards/card-1" }],
                header: "Other Cards"
              }
            ]
          }
        }
      };
      mockedAxios.get.mockResolvedValue({ data: responseWithoutTopCommanders });

      const result = await api.getThemeOrTribeCards("vampires");

      expect(result).toBeUndefined();
    });

    it("should handle empty cardlists array", async () => {
      const emptyResponse = {
        container: {
          json_dict: {
            cardlists: []
          }
        }
      };
      mockedAxios.get.mockResolvedValue({ data: emptyResponse });

      const result = await api.getThemeOrTribeCards("vampires");

      expect(result).toBeUndefined();
    });

    it("should handle Top Commanders at different indices", async () => {
      const differentOrderResponse = {
        container: {
          json_dict: {
            cardlists: [
              {
                cardviews: [{ name: "Card 1", url: "/cards/card-1" }],
                header: "First Section"
              },
              {
                cardviews: [{ name: "Card 2", url: "/cards/card-2" }],
                header: "Second Section"
              },
              {
                cardviews: [{ name: "Commander 1", url: "/commanders/commander-1" }],
                header: "Top Commanders"
              }
            ]
          }
        }
      };
      mockedAxios.get.mockResolvedValue({ data: differentOrderResponse });

      const result = await api.getThemeOrTribeCards("vampires");

      expect(result).toEqual(differentOrderResponse.container.json_dict.cardlists[2].cardviews);
    });

    it("should handle errors with error wrapper", async () => {
      const error = new Error("Network error");
      mockedAxios.get.mockRejectedValue(error);

      await api.getThemeOrTribeCards("vampires");

      expect(mockedAxiosErrorWrapper).toHaveBeenCalledWith(error);
    });

    it("should handle multiple sections with same name", async () => {
      const multipleSectionsResponse = {
        container: {
          json_dict: {
            cardlists: [
              {
                cardviews: [{ name: "Commander A", url: "/commanders/commander-a" }],
                header: "Top Commanders"
              },
              {
                cardviews: [{ name: "Commander B", url: "/commanders/commander-b" }],
                header: "Top Commanders"
              }
            ]
          }
        }
      };
      mockedAxios.get.mockResolvedValue({ data: multipleSectionsResponse });

      const result = await api.getThemeOrTribeCards("vampires");

      // Should return the first match
      expect(result).toEqual(multipleSectionsResponse.container.json_dict.cardlists[0].cardviews);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle malformed URLs gracefully", async () => {
      const api = new EdhRecApi();
      // Override URLs to test malformed scenarios
      api["base_url"] = "";
      api["tags_url"] = "";

      mockedAxios.get.mockRejectedValue(new Error("Invalid URL"));

      await api.getCommanders("test");

      expect(mockedAxiosErrorWrapper).toHaveBeenCalled();
    });

    it("should handle null/undefined commander names", async () => {
      const result = api.slugify([]);
      expect(result).toBe("");
    });

    it("should handle very long commander names", async () => {
      const longName = "A".repeat(1000);
      const result = api.slugify([longName]);
      expect(result).toBe("a".repeat(1000));
    });

    it("should handle unicode characters in commander names", async () => {
      const result = api.slugify(["Æther Adept"]);
      expect(result).toBe("ther-adept");
    });

    it("should handle numeric commander names", async () => {
      const result = api.slugify(["123 Commander"]);
      expect(result).toBe("123-commander");
    });
  });

  describe("API response structure validation", () => {
    it("should handle missing container property in response", async () => {
      const malformedResponse = { data: {} };
      mockedAxios.get.mockResolvedValue(malformedResponse);

      await expect(api.getCommanders("test")).rejects.toThrow();
    });

    it("should handle missing json_dict property in response", async () => {
      const malformedResponse = { data: { container: {} } };
      mockedAxios.get.mockResolvedValue(malformedResponse);

      await expect(api.getCommanders("test")).rejects.toThrow();
    });

    it("should handle missing cardlists property in response", async () => {
      const malformedResponse = { data: { container: { json_dict: {} } } };
      mockedAxios.get.mockResolvedValue(malformedResponse);

      await expect(api.getCommanders("test")).rejects.toThrow();
    });

    it("should handle empty cardlists array", async () => {
      const emptyResponse = { data: { container: { json_dict: { cardlists: [] } } } };
      mockedAxios.get.mockResolvedValue(emptyResponse);

      await expect(api.getCommanders("test")).rejects.toThrow();
    });
  });

  describe("Type safety and interface compliance", () => {
    it("should work with all ColorIdentity types", () => {
      const colors: ColorIdentity[] = [
        "mono-white", "mono-blue", "mono-black", "mono-red", "mono-green",
        "colorless", "azorius", "dimir", "rakdos", "gruul", "selesnya",
        "orzhov", "izzet", "golgari", "boros", "simic", "esper", "grixis",
        "jund", "naya", "bant", "abzan", "jeskai", "sultai", "mardu",
        "temur", "ink-treader", "witch-maw", "glint-eye", "dune-brood",
        "yore-tiller", "five-color"
      ];

      const mockResponse = {
        container: {
          json_dict: {
            cardlists: [{
              cardviews: [{ name: "Test Commander", url: "/test" }],
              header: "Test"
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      colors.forEach(async (color) => {
        await api.getCommanderByColor(color);
        expect(mockedAxios.get).toHaveBeenCalledWith(`https://json.edhrec.com/pages/commanders/${color}.json`);
      });
    });

    it("should work with all period types for getTopCommander", () => {
      const periods: Array<"year" | "month" | "week"> = ["year", "month", "week"];
      const mockResponse = {
        container: {
          json_dict: {
            cardlists: [{
              cardviews: [{ name: "Test Commander", url: "/test" }],
              header: "Test"
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      periods.forEach(async (period) => {
        await api.getTopCommander(period);
        expect(mockedAxios.get).toHaveBeenCalledWith(`https://json.edhrec.com/pages/commanders/${period}.json`);
      });
    });
  });
});