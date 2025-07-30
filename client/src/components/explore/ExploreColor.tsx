import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { ColorIdentity } from "@/api/edhRecApi";
import CardsByColor from "./CardsByColor";

const MANA_SYMBOLS = [
  { color: "mono-white", src: "https://svgs.scryfall.io/card-symbols/W.svg" },
  { color: "mono-blue", src: "https://svgs.scryfall.io/card-symbols/U.svg" },
  { color: "mono-black", src: "https://svgs.scryfall.io/card-symbols/B.svg" },
  { color: "mono-red", src: "https://svgs.scryfall.io/card-symbols/R.svg" },
  { color: "mono-green", src: "https://svgs.scryfall.io/card-symbols/G.svg" },
  { color: "colorless", src: "https://svgs.scryfall.io/card-symbols/C.svg" },
];

const COLOR_COMBINATIONS: Record<string, ColorIdentity> = {
  // Five-color
  "mono-black,mono-blue,mono-green,mono-red,mono-white": "five-color",

  // Four-color
  "mono-black,mono-blue,mono-green,mono-white": "witch-maw",
  "mono-black,mono-blue,mono-green,mono-red": "glint-eye",
  "mono-black,mono-green,mono-red,mono-white": "dune-brood",
  "mono-black,mono-blue,mono-red,mono-white": "yore-tiller",
  "mono-blue,mono-green,mono-red,mono-white": "ink-treader",

  // Tri-color
  "mono-black,mono-blue,mono-white": "esper",
  "mono-black,mono-green,mono-white": "abzan",
  "mono-black,mono-green,mono-blue": "sultai",
  "mono-black,mono-red,mono-green": "jund",
  "mono-black,mono-red,mono-white": "mardu",
  "mono-blue,mono-green,mono-white": "bant",
  "mono-blue,mono-red,mono-white": "jeskai",
  "mono-black,mono-blue,mono-red": "grixis",
  "mono-blue,mono-green,mono-red": "temur",
  "mono-green,mono-red,mono-white": "naya",

  // Dual-color
  "mono-black,mono-blue": "dimir",
  "mono-black,mono-green": "golgari",
  "mono-black,mono-red": "rakdos",
  "mono-black,mono-white": "orzhov",
  "mono-blue,mono-green": "simic",
  "mono-blue,mono-red": "izzet",
  "mono-blue,mono-white": "azorius",
  "mono-green,mono-red": "gruul",
  "mono-green,mono-white": "selesnya",
  "mono-red,mono-white": "boros",

  // Mono-color
  "mono-black": "mono-black",
  "mono-blue": "mono-blue",
  "mono-green": "mono-green",
  "mono-red": "mono-red",
  "mono-white": "mono-white",
  colorless: "colorless",
};

export default function ExploreColor() {
  const [searchParams, setSearchParam] = useSearchParams();
  const color = searchParams.get("color") as ColorIdentity;
  const [colorPrint, setColorPrint] = useState<ColorIdentity>(color);
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  // state to track what symbols where clicked the show feedback
  const [selectedSymbols, setSelectedSymbols] = useState<Record<string, boolean>>({
    "mono-white": false,
    "mono-blue": false,
    "mono-black": false,
    "mono-red": false,
    "mono-green": false,
    colorless: false,
  });

  const updateColors = useCallback(
    (color: ColorIdentity) => {
      setColorPrint(color);
      setSearchParam({ color });
    },
    [setSearchParam]
  );

  useEffect(() => {
    const sortedSymbols = [...activeSymbols].sort().join(",");
    const matchedColor = COLOR_COMBINATIONS[sortedSymbols];
    if (matchedColor) {
      updateColors(matchedColor);
    } else {
      updateColors(color ? color : "five-color");
    }
  }, [activeSymbols, color, updateColors]);

  function manaSymbolClickHandler(symbolColor: string) {
    setSelectedSymbols((prev) => ({
      ...prev,
      [symbolColor]: !prev[symbolColor],
    }));

    setActiveSymbols((prev) => (prev.includes(symbolColor) ? prev.filter((c) => c !== symbolColor) : [...prev, symbolColor]));
  }

  return (
    <div className="container mx-auto text-center mt-10">
      <h1 className="text-4xl font-bold">Explore Decks</h1>
      <div className="w-10 flex flex-row gap-4 mx-auto justify-center my-10">
        {MANA_SYMBOLS.map(({ color, src }) => (
          <img
            key={color}
            className={selectedSymbols[color] ? "rounded-4xl outline-1 outline-offset-4 outline-slate-400" : ""}
            src={src}
            alt={`${color}-mana`}
            onClick={() => manaSymbolClickHandler(color)}
          />
        ))}
      </div>
      <CardsByColor color={colorPrint} />
    </div>
  );
}
