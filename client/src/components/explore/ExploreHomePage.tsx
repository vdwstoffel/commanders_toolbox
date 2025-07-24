import { useCallback, useEffect, useState } from "react";

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

export default function ExploreHomePage() {
  const [colorPrint, setColorPrint] = useState<ColorIdentity>("five-color");
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

  useEffect(() => {
    // 5 color
    if (hasColors("mono-white", "mono-blue", "mono-black", "mono-red", "mono-green")) setColorPrint("five-color");
    // 4 color
    else if (hasColors("mono-white", "mono-blue", "mono-red", "mono-green")) setColorPrint("ink-treader");
    else if (hasColors("mono-white", "mono-blue", "mono-black", "mono-green")) setColorPrint("witch-maw");
    else if (hasColors("mono-blue", "mono-black", "mono-red", "mono-green")) setColorPrint("glint-eye");
    else if (hasColors("mono-white", "mono-black", "mono-red", "mono-green")) setColorPrint("dune-brood");
    else if (hasColors("mono-white", "mono-blue", "mono-black", "mono-red")) setColorPrint("yore-tiller");
    // tri-color
    else if (hasColors("mono-white", "mono-blue", "mono-black")) setColorPrint("esper");
    else if (hasColors("mono-blue", "mono-black", "mono-red")) setColorPrint("grixis");
    else if (hasColors("mono-black", "mono-red", "mono-green")) setColorPrint("jund");
    else if (hasColors("mono-red", "mono-green", "mono-white")) setColorPrint("naya");
    else if (hasColors("mono-green", "mono-white", "mono-blue")) setColorPrint("bant");
    else if (hasColors("mono-white", "mono-black", "mono-green")) setColorPrint("abzan");
    else if (hasColors("mono-blue", "mono-red", "mono-white")) setColorPrint("jeskai");
    else if (hasColors("mono-black", "mono-green", "mono-blue")) setColorPrint("sultai");
    else if (hasColors("mono-red", "mono-white", "mono-black")) setColorPrint("mardu");
    else if (hasColors("mono-green", "mono-blue", "mono-red")) setColorPrint("temur");
    // dual color
    else if (hasColors("mono-white", "mono-blue")) setColorPrint("azorius");
    else if (hasColors("mono-blue", "mono-black")) setColorPrint("dimir");
    else if (hasColors("mono-black", "mono-red")) setColorPrint("rakdos");
    else if (hasColors("mono-red", "mono-green")) setColorPrint("gruul");
    else if (hasColors("mono-green", "mono-white")) setColorPrint("selesnya");
    else if (hasColors("mono-white", "mono-black")) setColorPrint("orzhov");
    else if (hasColors("mono-blue", "mono-red")) setColorPrint("izzet");
    else if (hasColors("mono-black", "mono-green")) setColorPrint("golgari");
    else if (hasColors("mono-red", "mono-white")) setColorPrint("boros");
    else if (hasColors("mono-green", "mono-blue")) setColorPrint("simic");
    // Single Color
    else if (hasColors("mono-white")) setColorPrint("mono-white");
    else if (hasColors("mono-blue")) setColorPrint("mono-blue");
    else if (hasColors("mono-black")) setColorPrint("mono-black");
    else if (hasColors("mono-green")) setColorPrint("mono-green");
    else if (hasColors("mono-red")) setColorPrint("mono-red");
    else if (hasColors("colorless")) setColorPrint("colorless");
    else setColorPrint("five-color");
  }, [activeSymbols, hasColors]);

  function manaSymbolClickHandler(symbolColor: string) {
    setSelectedSymbols((prev) => ({
      ...prev,
      [symbolColor]: !prev[symbolColor],
    }));

    setActiveSymbols((prev) => (prev.includes(symbolColor) ? prev.filter((c) => c !== symbolColor) : [...prev, symbolColor]));
  }

  return (
    <div className="container flex flex-col justify-center content-center mt-10 mx-auto text-center">
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
