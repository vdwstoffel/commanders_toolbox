import { useMemo, useState } from "react";
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

  const sortedDeck = useMemo(() => {
    const copy = [...deck];
    const safeCmc = (n: number | null | undefined) => (Number.isFinite(n as number) ? (n as number) : Number.POSITIVE_INFINITY);
    return copy.sort((a, b) => {
      if (sortBy === "name") return a.card.cardName.localeCompare(b.card.cardName);
      // sortBy === "cmc"
      const diff = safeCmc(a.card.cmc) - safeCmc(b.card.cmc);
      return diff !== 0 ? diff : a.card.cardName.localeCompare(b.card.cardName);
    });
  }, [deck, sortBy]);

  const commander: DeckCardDetails[] = [];
  const creatures: DeckCardDetails[] = [];
  const instants: DeckCardDetails[] = [];
  const sorceries: DeckCardDetails[] = [];
  const artifacts: DeckCardDetails[] = [];
  const enchantments: DeckCardDetails[] = [];
  const battles: DeckCardDetails[] = [];
  const planeswalkers: DeckCardDetails[] = [];
  const lands: DeckCardDetails[] = [];

  for (let i = 0; i < sortedDeck!.length; i++) {
    if (sortedDeck[i].commander) {
      commander.push(sortedDeck[i]);
      continue;
    }

    switch (sortedDeck[i].card.cardType) {
      case "creature":
        creatures.push(sortedDeck[i]);
        break;
      case "instant":
        instants.push(sortedDeck[i]);
        break;
      case "sorcery":
        sorceries.push(sortedDeck[i]);
        break;
      case "artifact":
        artifacts.push(sortedDeck[i]);
        break;
      case "enchantment":
        enchantments.push(sortedDeck[i]);
        break;
      case "battle":
        battles.push(sortedDeck[i]);
        break;
      case "planeswalker":
        planeswalkers.push(sortedDeck[i]);
        break;
      case "land":
        lands.push(sortedDeck[i]);
        break;
      default:
        throw new Error(`${sortedDeck[i].card.cardName} has an unknown card type`);
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
    Commander: sortedDeck.filter((card) => card.commander),
    "0 ": sortedDeck.filter((card) => card.card.cmc === 0 && card.card.cardType !== "land" && !card.commander),
    "1 ": sortedDeck.filter((card) => card.card.cmc === 1 && !card.commander),
    "2 ": sortedDeck.filter((card) => card.card.cmc === 2 && !card.commander),
    "3 ": sortedDeck.filter((card) => card.card.cmc === 3 && !card.commander),
    "4 ": sortedDeck.filter((card) => card.card.cmc === 4 && !card.commander),
    "5 ": sortedDeck.filter((card) => card.card.cmc === 5 && !card.commander),
    "6 ": sortedDeck.filter((card) => card.card.cmc === 6 && !card.commander),
    "7 ": sortedDeck.filter((card) => card.card.cmc === 7 && !card.commander),
    "8 ": sortedDeck.filter((card) => card.card.cmc === 8 && !card.commander),
    "9 ": sortedDeck.filter((card) => card.card.cmc === 9 && !card.commander),
    "10+": sortedDeck.filter((card) => (card.card.cmc ?? Number.POSITIVE_INFINITY) >= 10 && !card.commander),
    Lands: sortedDeck.filter((card) => card.card.cardType === "land"),
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
    link.setAttribute("download", `${sortedDeck[0].deck.deckName}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function sortDeckBy(next: "name" | "cmc") {
    setSortBy(next);
  }

  return (
    <div>
      <div className="mx-auto text-center mb-10 flex justify-center items-center gap-2">
        {/* Group By Select */}
        <label htmlFor="group-by-select">Group By</label>
        <Select value={groupBy} onValueChange={(value: "type" | "cmc") => setGroupBy(value)}>
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
        <label htmlFor="sort-by-select">Sort By</label>
        <Select value={sortBy} onValueChange={(value: "name" | "cmc") => sortDeckBy(value)}>
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
