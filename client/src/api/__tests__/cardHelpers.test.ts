import { describe, it, expect } from "vitest";
import { scryfallImageFromId } from "@/api/scryfallApi";
import { inclusionPercent } from "@/api/edhRecApi";

describe("scryfallImageFromId", () => {
  it("builds a Scryfall CDN url from the card id, defaulting to normal size", () => {
    expect(scryfallImageFromId("6a5d8fad-2ffd-4645-8c49-907999b6cecf")).toBe(
      "https://cards.scryfall.io/normal/front/6/a/6a5d8fad-2ffd-4645-8c49-907999b6cecf.jpg",
    );
  });

  it("honours the requested size", () => {
    expect(scryfallImageFromId("6a5d8fad-2ffd-4645-8c49-907999b6cecf", "small")).toBe(
      "https://cards.scryfall.io/small/front/6/a/6a5d8fad-2ffd-4645-8c49-907999b6cecf.jpg",
    );
  });
});

describe("inclusionPercent", () => {
  it("returns rounded percentage of decks running the card", () => {
    expect(inclusionPercent({ num_decks: 56, potential_decks: 100 })).toBe(56);
    expect(inclusionPercent({ num_decks: 1, potential_decks: 3 })).toBe(33);
  });

  it("returns 0 when data is missing or potential_decks is 0", () => {
    expect(inclusionPercent({})).toBe(0);
    expect(inclusionPercent({ num_decks: 5, potential_decks: 0 })).toBe(0);
  });
});
