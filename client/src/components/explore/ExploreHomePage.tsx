import { useCallback, useEffect, useState } from "react";

const WHITE_MANA = "https://svgs.scryfall.io/card-symbols/W.svg";
const BLUE_MANA = "https://svgs.scryfall.io/card-symbols/U.svg";
const BLACK_MANA = "https://svgs.scryfall.io/card-symbols/B.svg";
const RED_MANA = "https://svgs.scryfall.io/card-symbols/R.svg";
const GREEN_MANA = "https://svgs.scryfall.io/card-symbols/G.svg";
const COLORLESS_MANA = "https://svgs.scryfall.io/card-symbols/C.svg";

export default function ExploreHomePage() {
  const [colorPrint, setColorPrint] = useState<string>("All");
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  // additional state to check if symbol should have an outline
  const [whiteSelected, setWhiteSelected] = useState<boolean>(false);
  const [blueSelected, setBlueSelected] = useState<boolean>(false);
  const [blackSelected, setBlackSelected] = useState<boolean>(false);
  const [redSelected, setRedSelected] = useState<boolean>(false);
  const [greenSelected, setGreenSelected] = useState<boolean>(false);
  const [colorlessSelected, setColorlessSelected] = useState<boolean>(false);

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
    // check if the symbol is in the active symbols, if not add it ,else remove it
    if (activeSymbols.includes(symbolColor)) {
      const copy = [...activeSymbols];
      const index = copy.indexOf(symbolColor);
      copy.splice(index, 1);
      setActiveSymbols(copy);
    } else {
      const copy = [...activeSymbols];
      copy.push(symbolColor);
      setActiveSymbols(copy);
    }

    switch (symbolColor) {
      case "white":
        setWhiteSelected(!whiteSelected);
        break;
      case "blue":
        setBlueSelected(!blueSelected);
        break;
      case "black":
        setBlackSelected(!blackSelected);
        break;
      case "red":
        setRedSelected(!redSelected);
        break;
      case "green":
        setGreenSelected(!greenSelected);
        break;
      case "colorless":
        setColorlessSelected(!colorlessSelected);
        break;
      default:
        console.warn(`Unrecognized color: ${symbolColor}`);
    }
  }

  return (
    <div className="container flex flex-col justify-center content-center mt-10 mx-auto text-center">
      <h1 className="text-4xl font-bold">Explore Decks</h1>
      <div className="w-10 flex flex-row gap-4 mx-auto justify-center my-10">
        <img
          className={whiteSelected ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
          src={WHITE_MANA}
          alt="w-mana"
          onClick={() => manaSymbolClickHandler("white")}
        />
        <img
          className={blueSelected ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
          src={BLUE_MANA}
          alt="u-mana"
          onClick={() => manaSymbolClickHandler("blue")}
        />
        <img
          className={blackSelected ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
          src={BLACK_MANA}
          alt="b-mana"
          onClick={() => manaSymbolClickHandler("black")}
        />
        <img
          className={redSelected ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
          src={RED_MANA}
          alt="r-mana"
          onClick={() => manaSymbolClickHandler("red")}
        />
        <img
          className={greenSelected ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
          src={GREEN_MANA}
          alt="g-mana"
          onClick={() => manaSymbolClickHandler("green")}
        />
        <img
          className={colorlessSelected ? "rounded-4xl outline-1 outline-offset-4 outline-blue-300" : ""}
          src={COLORLESS_MANA}
          alt="c-mana"
          onClick={() => manaSymbolClickHandler("colorless")}
        />
      </div>
      <p>Selected: {colorPrint}</p>
    </div>
  );
}
