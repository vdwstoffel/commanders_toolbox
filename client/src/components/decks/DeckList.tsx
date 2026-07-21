import { useMemo, useState } from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import MagicCardImage from "../cards/MagicCardImage";

import { BackendDeckApi, type DeckCardDetails } from "@/api/backendDeckApi";
import type { MagicCard } from "@/api/scryfallApi";
import CardTypeContainer from "./CardTypeContainer";
import CardSearchWithAutoComplete from "./CardSearchWithAutoComplete";
import AddCardDialog from "./AddCardDialog";
import OverlayWrapper from "../ui/OverlayWrapper";
import { Button } from "../ui/button";
import { usePopulateBasicLands } from "./useDeckQuery";
import { useParams } from "react-router-dom";
import { useUser } from "../user/useUser";
import toast from "react-hot-toast";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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

  // State for grouping/sorting/filtering and the add-card flow
  const [groupBy, setGroupBy] = useState<"type" | "cmc">("type");
  const [sortBy, setSortBy] = useState<"name" | "cmc">("cmc");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [cardToAdd, setCardToAdd] = useState<MagicCard | null>(null);

  const deckColorIdentity = deck[0].deck.colorIdentity;
  const commanderNames = deck[0].deck.commander;

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

  // Client-side filter of the visible list by card name
  const filteredDeck = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return sortedDeck;
    return sortedDeck.filter((card) => card.card.cardName.toLowerCase().includes(q));
  }, [sortedDeck, filterQuery]);

  const commander: DeckCardDetails[] = [];
  const creatures: DeckCardDetails[] = [];
  const instants: DeckCardDetails[] = [];
  const sorceries: DeckCardDetails[] = [];
  const artifacts: DeckCardDetails[] = [];
  const enchantments: DeckCardDetails[] = [];
  const battles: DeckCardDetails[] = [];
  const planeswalkers: DeckCardDetails[] = [];
  const lands: DeckCardDetails[] = [];

  for (let i = 0; i < filteredDeck.length; i++) {
    if (filteredDeck[i].commander) {
      commander.push(filteredDeck[i]);
      continue;
    }

    switch (filteredDeck[i].card.cardType) {
      case "creature":
        creatures.push(filteredDeck[i]);
        break;
      case "instant":
        instants.push(filteredDeck[i]);
        break;
      case "sorcery":
        sorceries.push(filteredDeck[i]);
        break;
      case "artifact":
        artifacts.push(filteredDeck[i]);
        break;
      case "enchantment":
        enchantments.push(filteredDeck[i]);
        break;
      case "battle":
        battles.push(filteredDeck[i]);
        break;
      case "planeswalker":
        planeswalkers.push(filteredDeck[i]);
        break;
      case "land":
        lands.push(filteredDeck[i]);
        break;
      default:
        throw new Error(`${filteredDeck[i].card.cardName} has an unknown card type`);
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

  const cardsByMana = useMemo(
    () => ({
      Commander: filteredDeck.filter((card) => card.commander),
      "0 ": filteredDeck.filter((card) => card.card.cmc === 0 && card.card.cardType !== "land" && !card.commander),
      "1 ": filteredDeck.filter((card) => card.card.cmc === 1 && !card.commander),
      "2 ": filteredDeck.filter((card) => card.card.cmc === 2 && !card.commander),
      "3 ": filteredDeck.filter((card) => card.card.cmc === 3 && !card.commander),
      "4 ": filteredDeck.filter((card) => card.card.cmc === 4 && !card.commander),
      "5 ": filteredDeck.filter((card) => card.card.cmc === 5 && !card.commander),
      "6 ": filteredDeck.filter((card) => card.card.cmc === 6 && !card.commander),
      "7 ": filteredDeck.filter((card) => card.card.cmc === 7 && !card.commander),
      "8 ": filteredDeck.filter((card) => card.card.cmc === 8 && !card.commander),
      "9 ": filteredDeck.filter((card) => card.card.cmc === 9 && !card.commander),
      "10+": filteredDeck.filter((card) => (card.card.cmc ?? Number.POSITIVE_INFINITY) >= 10 && !card.commander),
      Lands: filteredDeck.filter((card) => card.card.cardType === "land"),
    }),
    [filteredDeck]
  );

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
      {/* Toolbar: add / filter / group / sort */}
      <div className="mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl bg-card p-4">
        <div className="min-w-[240px] flex-1">
          <CardSearchWithAutoComplete label="Add a card" setValue={setCardToAdd} />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="deck-filter">Filter</Label>
          <Input
            id="deck-filter"
            type="search"
            placeholder="Filter by name…"
            className="w-[180px]"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label>Group By</Label>
          <Select value={groupBy} onValueChange={(value: "type" | "cmc") => setGroupBy(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="cmc">CMC</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Sort By</Label>
          <Select value={sortBy} onValueChange={(value: "name" | "cmc") => sortDeckBy(value)}>
            <SelectTrigger className="w-[120px]">
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
      </div>

      {cardToAdd && (
        <OverlayWrapper hideFn={() => setCardToAdd(null)}>
          <AddCardDialog
            card={cardToAdd}
            deckColorIdentity={deckColorIdentity}
            commanderNames={commanderNames}
            deckCards={deck}
            onClose={() => setCardToAdd(null)}
          />
        </OverlayWrapper>
      )}
      <div className="grid md:grid-cols-[2fr_5fr_1fr] justify-center">
        <div className="md:col-span-1 mx-auto flex flex-col">
          <div className="sticky top-20 flex flex-col rounded-xl bg-card p-3">
            <MagicCardImage imageUrl={shownCardImgUrl} className="w-full max-w-[340px]" />
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
        <div className="w-full rounded-md bg-muted px-3 sm:columns-1 md:columns-1 lg:columns-2">
          {filteredDeck.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No cards match “{filterQuery}”.</p>
          ) : (
            /* Iterate through each card type then each card in that type */
            Object.entries(groupBy === "cmc" ? cardsByMana : CardTypes).map(([heading, cards]) =>
              cards.length > 0 ? (
                <CardTypeContainer key={heading} cards={cards} heading={heading} hoverFunc={setShownCardImgUIrl} />
              ) : null
            )
          )}
        </div>
      </div>
    </div>
  );
}
