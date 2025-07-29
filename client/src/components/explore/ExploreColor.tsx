import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { ColorIdentity } from "@/api/edhRecApi";
import CardsByColorContainer from "./CardsByColorContainer";

const MANA_SYMBOLS = [
  { color: "mono-white", src: "https://svgs.scryfall.io/card-symbols/W.svg" },
  { color: "mono-blue", src: "https://svgs.scryfall.io/card-symbols/U.svg" },
  { color: "mono-black", src: "https://svgs.scryfall.io/card-symbols/B.svg" },
  { color: "mono-red", src: "https://svgs.scryfall.io/card-symbols/R.svg" },
  { color: "mono-green", src: "https://svgs.scryfall.io/card-symbols/G.svg" },
  { color: "colorless", src: "https://svgs.scryfall.io/card-symbols/C.svg" },
];

export default function ExploreColor() {
  const [searchParams, setSearchParam] = useSearchParams();
  const color = searchParams.get("color") as ColorIdentity;
  console.log(color);
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

  const hasColors = useCallback(
    (...colors: string[]) => {
      return colors.every((color) => activeSymbols.includes(color));
    },
    [activeSymbols]
  );

  const updateColors = useCallback((color: ColorIdentity) => {
    setColorPrint(color);
    setSearchParam({ color });
  }, [setSearchParam]);

  useEffect(() => {
    // 5 color
    if (hasColors("mono-white", "mono-blue", "mono-black", "mono-red", "mono-green")) updateColors("five-color");
    // 4 color
    else if (hasColors("mono-white", "mono-blue", "mono-red", "mono-green")) updateColors("ink-treader");
    else if (hasColors("mono-white", "mono-blue", "mono-black", "mono-green")) updateColors("witch-maw");
    else if (hasColors("mono-blue", "mono-black", "mono-red", "mono-green")) updateColors("glint-eye");
    else if (hasColors("mono-white", "mono-black", "mono-red", "mono-green")) updateColors("dune-brood");
    else if (hasColors("mono-white", "mono-blue", "mono-black", "mono-red")) updateColors("yore-tiller");
    // tri-color
    else if (hasColors("mono-white", "mono-blue", "mono-black")) updateColors("esper");
    else if (hasColors("mono-blue", "mono-black", "mono-red")) updateColors("grixis");
    else if (hasColors("mono-black", "mono-red", "mono-green")) updateColors("jund");
    else if (hasColors("mono-red", "mono-green", "mono-white")) updateColors("naya");
    else if (hasColors("mono-green", "mono-white", "mono-blue")) updateColors("bant");
    else if (hasColors("mono-white", "mono-black", "mono-green")) updateColors("abzan");
    else if (hasColors("mono-blue", "mono-red", "mono-white")) updateColors("jeskai");
    else if (hasColors("mono-black", "mono-green", "mono-blue")) updateColors("sultai");
    else if (hasColors("mono-red", "mono-white", "mono-black")) updateColors("mardu");
    else if (hasColors("mono-green", "mono-blue", "mono-red")) updateColors("temur");
    // dual color
    else if (hasColors("mono-white", "mono-blue")) updateColors("azorius");
    else if (hasColors("mono-blue", "mono-black")) updateColors("dimir");
    else if (hasColors("mono-black", "mono-red")) updateColors("rakdos");
    else if (hasColors("mono-red", "mono-green")) updateColors("gruul");
    else if (hasColors("mono-green", "mono-white")) updateColors("selesnya");
    else if (hasColors("mono-white", "mono-black")) updateColors("orzhov");
    else if (hasColors("mono-blue", "mono-red")) updateColors("izzet");
    else if (hasColors("mono-black", "mono-green")) updateColors("golgari");
    else if (hasColors("mono-red", "mono-white")) updateColors("boros");
    else if (hasColors("mono-green", "mono-blue")) updateColors("simic");
    // Single Color
    else if (hasColors("mono-white")) updateColors("mono-white");
    else if (hasColors("mono-blue")) updateColors("mono-blue");
    else if (hasColors("mono-black")) updateColors("mono-black");
    else if (hasColors("mono-green")) updateColors("mono-green");
    else if (hasColors("mono-red")) updateColors("mono-red");
    else if (hasColors("colorless")) updateColors("colorless");
    else updateColors(color ? color : "five-color");
  }, [activeSymbols, hasColors, color, updateColors]);

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
            className={selectedSymbols[color] ? "rounded-4xl outline-1 outline-offset-4 outline-mono-blue-300" : ""}
            src={src}
            alt={`${color}-mana`}
            onClick={() => manaSymbolClickHandler(color)}
          />
        ))}
      </div>
      <CardsByColorContainer color={colorPrint} />
    </div>
  );
}
