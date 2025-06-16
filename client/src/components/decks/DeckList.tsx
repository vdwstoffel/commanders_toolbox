import { useState } from "react";
import MagicCardImage from "../cards/MagicCardImage";

import { BackendDeckApi, type DeckCardDetails } from "@/api/backendDeckApi";
import CardTypeContainer from "./CardTypeContainer";
import { Button } from "../ui/button";
import { usePopulateBasicLands } from "./useDeckQuery";
import { useParams } from "react-router-dom";
import { useUser } from "../user/useUser";

interface DeckListProps {
  deck: DeckCardDetails[];
}

const deckApi = new BackendDeckApi();

export default function DeckList({ deck }: DeckListProps) {
  const { deckId } = useParams();
  const { idToken } = useUser();
  const [shownCardImgUrl, setShownCardImgUIrl] = useState<string>(deck[0].card.cardImageUrl[0]);
  const { populateLands } = usePopulateBasicLands();

  deck?.sort((a, b) => a.card.cmc - b.card.cmc); // sort the cards by cmc
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

  async function downloadDeckListHandler() {
    const res = await deckApi.downloadDeckList(Number(deckId), idToken);

    const url = window.URL.createObjectURL(new Blob([res as string]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${deck[0].deck.deckName}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <>
      <div className="grid md:grid-cols-[2fr_5fr_1fr] justify-center">
        <div className="md:col-span-1 mx-auto flex flex-col">
          <MagicCardImage imageUrl={shownCardImgUrl} />
          <Button className="mx-auto mt-5" onClick={() => populateLands()}>
            Populate Lands
          </Button>
          <Button className="mx-auto my-1" onClick={downloadDeckListHandler}>
            Download Deck
          </Button>
        </div>
        <div className="w-full rounded-md bg-slate-200/30 px-3 sm:columns-1 md:columns-1 lg:columns-2">
          {/* Iterate through each car type then each card in that type */}
          {Object.entries(CardTypes).map(([heading, cards]) => {
            return cards.length > 0 ? (
              <CardTypeContainer key={heading} cards={cards} heading={heading} hoverFunc={setShownCardImgUIrl} />
            ) : null;
          })}
        </div>
      </div>
    </>
  );
}
