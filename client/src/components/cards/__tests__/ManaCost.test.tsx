import { render, screen } from "@testing-library/react";
import ManaCost, { parseManaSymbols } from "../ManaCost";

describe("ManaCost", () => {
  it("parses mana cost into symbol codes", () => {
    expect(parseManaSymbols("{3}{U}{R}{G}")).toEqual(["3", "U", "R", "G"]);
    expect(parseManaSymbols("")).toEqual([]);
    expect(parseManaSymbols(undefined)).toEqual([]);
  });

  it("renders one image per symbol", () => {
    render(<ManaCost mana_cost="{3}{U}{R}{G}" />);
    expect(screen.getAllByTestId("mana-symbol")).toHaveLength(4);
  });

  it("renders nothing for an empty cost", () => {
    render(<ManaCost mana_cost="" />);
    expect(screen.queryByTestId("mana-symbol")).toBeNull();
  });
});
