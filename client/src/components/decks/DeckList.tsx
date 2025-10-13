import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import MagicCardImage from "../cards/MagicCardImage";

import { BackendDeckApi, type DeckCardDetails } from "@/api/backendDeckApi";
import CardTypeContainer from "./CardTypeContainer";
import { Button } from "../ui/button";
import { usePopulateBasicLands } from "./useDeckQuery";
import { useParams } from "react-router-dom";
import { useUser } from "../user/useUser";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DeckListProps {
  deck: DeckCardDetails[];
}

const deckApi = new BackendDeckApi();

export default function DeckList({ deck }: DeckListProps) {
  const { deckId } = useParams();
  const { idToken } = useUser();
  const [shownCardImgUrl, setShownCardImgUIrl] = useState<string>(
    deck.find((card) => card.commander)?.card.cardImageUrl[0] ?? deck[0].card.cardImageUrl[0]
  );
  const { populateLands } = usePopulateBasicLands();

  // State for grouping/sorting
  const [groupBy, setGroupBy] = useState<"type" | "cmc">("type");
  const [sortBy, setSortBy] = useState<"name" | "cmc">("cmc");


  if (sortBy === "cmc") deck.sort((a, b) => a.card.cmc - b.card.cmc);

  const commander: DeckCardDetails[] = [];
  const creatures: DeckCardDetails[] = [];
  const instants: DeckCardDetails[] = [];
  const sorceries: DeckCardDetails[] = [];
  const artifacts: DeckCardDetails[] = [];
  const enchantments: DeckCardDetails[] = [];
  const battles: DeckCardDetails[] = [];
  const planeswalkers: DeckCardDetails[] = [];
  const lands: DeckCardDetails[] = [];

  for (let i = 0; i < deck!.length; i++) {
    if (deck[i].commander) {
      commander.push(deck[i]);
      continue;
    }

    switch (deck[i].card.cardType) {
      case "creature":
        creatures.push(deck[i]);
        break;
      case "instant":
        instants.push(deck[i]);
        break;
      case "sorcery":
        sorceries.push(deck[i]);
        break;
      case "artifact":
        artifacts.push(deck[i]);
        break;
      case "enchantment":
        enchantments.push(deck[i]);
        break;
      case "battle":
        battles.push(deck[i]);
        break;
      case "planeswalker":
        planeswalkers.push(deck[i]);
        break;
      case "land":
        lands.push(deck[i]);
        break;
      default:
        throw new Error(`${deck[i].card.cardName} has an unknown card type`);
    }
  }

  const CardTypes = {
    /* Header: card type */
    Commander: commander,
    Creatures: creatures,
    Instants: instants,
    Sorceries: sorceries,
    Artifacts: artifacts,
    Enchantments: enchantments,
    Battles: battles,
    Planeswalkers: planeswalkers,
    Lands: lands,
  };

  const cardsByMana = {
    Commander: deck.filter((card) => card.commander),
    "0 ": deck.filter((card) => card.card.cmc === 0 && card.card.cardType !== "land"),
    "1 ": deck.filter((card) => card.card.cmc === 1 && !card.commander),
    "2 ": deck.filter((card) => card.card.cmc === 2 && !card.commander),
    "3 ": deck.filter((card) => card.card.cmc === 3 && !card.commander),
    "4 ": deck.filter((card) => card.card.cmc === 4 && !card.commander),
    "5 ": deck.filter((card) => card.card.cmc === 5 && !card.commander),
    "6 ": deck.filter((card) => card.card.cmc === 6 && !card.commander),
    "7 ": deck.filter((card) => card.card.cmc === 7 && !card.commander),
    "8 ": deck.filter((card) => card.card.cmc === 8 && !card.commander),
    "9 ": deck.filter((card) => card.card.cmc === 9 && !card.commander),
    "10+": deck.filter((card) => card.card.cmc >= 10),
    Lands: deck.filter((card) => card.card.cardType === "land"),
  };

  async function downloadDeckListHandler(copyTo: "file" | "clipboard") {
    const res = await deckApi.downloadDeckList(Number(deckId), idToken);

    if (copyTo === "clipboard") {
      try {
        await navigator.clipboard.writeText(res);
        toast.success("Copied to clipboard");
      } catch (err) {
        toast.error(`Error copying content to clipboard: ${err}`);
      }
      return;
    }

    const url = window.URL.createObjectURL(new Blob([res as string]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${deck[0].deck.deckName}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function sortDeckBy(sortBy: "name" | "cmc") {
    setSortBy(sortBy);

    if (sortBy === "name") deck.sort((a,b) => a.card.cardName.localeCompare(b.card.cardName));
    if (sortBy === "cmc") deck.sort((a, b) => a.card.cmc - b.card.cmc);
  }

  return (
    <div>
      <div className="mx-auto text-center mb-10 flex justify-center items-center gap-2">

        {/* Group By Select */}
        <h1>Group By</h1>
        <Select defaultValue={groupBy} onValueChange={(value: "type" | "cmc") => setGroupBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="cmc">CMC</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Sortby Select */}
        <h1>Sort By</h1>
        <Select defaultValue={sortBy} onValueChange={(value: "name" | "cmc") => sortDeckBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="cmc">CMC</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>


      </div>
      <div className="grid md:grid-cols-[2fr_5fr_1fr] justify-center">
        <div className="md:col-span-1 mx-auto flex flex-col">
          <div className="sticky top-20 flex flex-col">
            <MagicCardImage imageUrl={shownCardImgUrl} data-testid="magic-card-image" />
            <Button className="mx-auto my-3" onClick={() => populateLands()}>
              Populate Lands
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="mx-auto my-2 min-w-32">Download</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-42">
                <DropdownMenuCheckboxItem onClick={() => downloadDeckListHandler("file")}>Download deck</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem onClick={() => downloadDeckListHandler("clipboard")}>
                  Copy to clipboard
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="w-full rounded-md bg-slate-200/30 px-3 sm:columns-1 md:columns-1 lg:columns-2">
          {/* Iterate through each car type then each card in that type */}
          {Object.entries(groupBy === "cmc" ? cardsByMana : CardTypes).map(([heading, cards]) => {
            return cards.length > 0 ? (
              <CardTypeContainer key={heading} cards={cards} heading={heading} hoverFunc={setShownCardImgUIrl} />
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
