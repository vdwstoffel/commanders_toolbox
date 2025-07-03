import { useState } from "react";


import MagicCardImage from "../cards/MagicCardImage";
import Loader from "../ui/Loader";

import { landCycles } from "../../utils/landCycles";
import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";
import { useAddCardToDeck, useGetDeckById } from "./useDeckQuery";
import {getDeckColorIdentity} from "../../utils/helperFunctions";
import OverlayWrapper from "../ui/OverlayWrapper";
import { Button } from "../ui/button";
import FullCardInfo from "../cards/FullCardInfo";

const TABS = landCycles.map((cycle) => cycle.label);

const scryfallApi = new ScryfallApi();

export default function LandCycles() {
  const { isWaitingForDeck, deckByIdError, deckById } = useGetDeckById();
  const [selectedCardScryfallDetails, setSelectedCardScryfallDetails] = useState<MagicCard | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  // Deck Hooks
  const { addCard } = useAddCardToDeck();

  if (isWaitingForDeck) return <Loader />;
  if (deckByIdError) throw new Error("Could not load deck");

  const cardsInDeck = deckById?.map((card) => card.card.cardName);
  // Get the color identities of all commanders, make a set of color identities, and join it as a string
  const colorIdentity = getDeckColorIdentity(deckById!);

  async function selectCardHandler(cardName: string) {
    const cardDetails = await scryfallApi.getCardByName(cardName);
    setSelectedCardScryfallDetails(cardDetails);
    setShowOverlay(true);
  }

  function closeOveralyHandler() {
    setShowOverlay(false);
  }

  function addCardToDeckHandler() {
    if (!selectedCardScryfallDetails) return;
    addCard(selectedCardScryfallDetails);
    setShowOverlay(false);
  }

  return (
    <div className="relative grid grid-cols-[1fr_6fr]">
      <div className="">
        <div className="sticky top-10 mx-auto mt-10 flex-col rounded-lg bg-neutral-700 p-3 text-neutral-200 hidden md:flex">
          {TABS.map((tab) => (
            <a key={tab} href={`#${tab}`}>
              {tab}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-4">
        {landCycles.map((lands) => {
          return (
            <div className="my-10" key={lands.label}>
              <h1 className="mb-5 rounded-lg bg-neutral-700 text-center text-xl font-bold text-neutral-200" id={lands.label}>
                {lands.label}
              </h1>
              <ul className="flex flex-wrap content-center justify-center gap-2 hover:cursor-pointer">
                {lands.lands.map((land) => {
                  if (cardsInDeck?.includes(land.cardName)) return; // Do not show card if it is in deck
                  // If the land is not in the decks color identity do not show it.
                  for (const c of land.colors) {
                    if (!colorIdentity?.includes(c)) return;
                  }

                  return (
                    <li key={land.cardName} onClick={() => selectCardHandler(land.cardName)}>
                      <MagicCardImage imageUrl={land.cardImage} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      {showOverlay && (
        <OverlayWrapper hideFn={closeOveralyHandler}>
          <Button onClick={addCardToDeckHandler} variant="secondary">Add to deck</Button>
          <FullCardInfo cardName={selectedCardScryfallDetails!.name} />
        </OverlayWrapper>
      )}
    </div>
  );
}
