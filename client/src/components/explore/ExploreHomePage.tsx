import { useCallback, useEffect, useState } from "react";

const MANA_SYMBOLS = [
  { color: "white", src: "https://svgs.scryfall.io/card-symbols/W.svg" },
  { color: "blue", src: "https://svgs.scryfall.io/card-symbols/U.svg" },
  { color: "black", src: "https://svgs.scryfall.io/card-symbols/B.svg" },
  { color: "red", src: "https://svgs.scryfall.io/card-symbols/R.svg" },
  { color: "green", src: "https://svgs.scryfall.io/card-symbols/G.svg" },
  { color: "colorless", src: "https://svgs.scryfall.io/card-symbols/C.svg" },
];

export default function ExploreHomePage() {
  const [colorPrint, setColorPrint] = useState<string>("All");
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  // state to track what symbols where clicked the show feedback
  const [selectedSymbols, setSelectedSymbols] = useState<Record<string, boolean>>({
    white: false,
    blue: false,
    black: false,
    red: false,
    green: false,
    colorless: false,
  });

  const hasColors = useCallback(
    (...colors: string[]) => {
      return colors.every((color) => activeSymbols.includes(color));
    },
    [activeSymbols]
  );

  useEffect(() => {
    if (activeSymbols.length === 0) setColorPrint("All");
    // 5 color
    else if (hasColors("white", "blue", "black", "red", "green")) setColorPrint("five-color");
    // 4 color
    else if (hasColors("white", "blue", "red", "green")) setColorPrint("ink-treader");
    else if (hasColors("white", "blue", "black", "green")) setColorPrint("witch-maw");
    else if (hasColors("blue", "black", "red", "green")) setColorPrint("glint-eye");
    else if (hasColors("white", "black", "red", "green")) setColorPrint("dune-brood");
    else if (hasColors("white", "blue", "black", "red")) setColorPrint("yore-tiller");
    // tri-color
    else if (hasColors("white", "blue", "black")) setColorPrint("esper");
    else if (hasColors("blue", "black", "red")) setColorPrint("grixis");
    else if (hasColors("black", "red", "green")) setColorPrint("jund");
    else if (hasColors("red", "green", "white")) setColorPrint("naya");
    else if (hasColors("green", "white", "blue")) setColorPrint("bant");
    else if (hasColors("white", "black", "green")) setColorPrint("abzan");
    else if (hasColors("blue", "red", "white")) setColorPrint("jeskai");
    else if (hasColors("black", "green", "blue")) setColorPrint("sultai");
    else if (hasColors("red", "white", "black")) setColorPrint("mardu");
    else if (hasColors("green", "blue", "red")) setColorPrint("temur");
    // dual color
    else if (hasColors("white", "blue")) setColorPrint("azorius");
    else if (hasColors("blue", "black")) setColorPrint("dimir");
    else if (hasColors("black", "red")) setColorPrint("rakdos");
    else if (hasColors("red", "green")) setColorPrint("gruul");
    else if (hasColors("green", "white")) setColorPrint("selesnya");
    else if (hasColors("white", "black")) setColorPrint("orzhov");
    else if (hasColors("blue", "red")) setColorPrint("izzet");
    else if (hasColors("black", "green")) setColorPrint("golgari");
    else if (hasColors("red", "white")) setColorPrint("boros");
    else if (hasColors("green", "blue")) setColorPrint("simic");
    // Single Color
    else if (hasColors("white")) setColorPrint("white");
    else if (hasColors("blue")) setColorPrint("blue");
    else if (hasColors("black")) setColorPrint("black");
    else if (hasColors("green")) setColorPrint("green");
    else if (hasColors("red")) setColorPrint("red");
    else if (hasColors("colorless")) setColorPrint("colorless");
    else setColorPrint("all");
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
            className={selectedSymbols[color] ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
            src={src}
            alt={`${color}-mana`}
            onClick={() => manaSymbolClickHandler(color)}
          />
        ))}
      </div>
      <p>Selected: {colorPrint}</p>
    </div>
  );
}
