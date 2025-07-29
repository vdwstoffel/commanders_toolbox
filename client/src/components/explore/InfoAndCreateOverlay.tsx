import toast from "react-hot-toast";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import FullCardInfo from "../cards/FullCardInfo";
import OverlayWrapper from "../ui/OverlayWrapper";
import { useCreateDeck } from "../decks/useDeckQuery";
import { ScryfallApi } from "@/api/scryfallApi";

interface Props {
  cardName: string[];
  setHideStateAction: Dispatch<SetStateAction<boolean>>;
}

export default function InfoAndCreateOverlay({ cardName, setHideStateAction }: Props) {
  const { createDeck } = useCreateDeck();

  async function createDeckClickHandler() {
    if (!cardName) return;

    try {
      if (cardName.length === 1) {
        const commander = await new ScryfallApi().getCardByName(cardName[0]);
        createDeck({ deckName: cardName[0], commanders: [commander], deckTheme: "custom" });
      } else {
        const commander1 = await new ScryfallApi().getCardByName(cardName[0]);
        const commander2 = await new ScryfallApi().getCardByName(cardName[1]);
        createDeck({ deckName: cardName[0] + " / " + cardName[1], commanders: [commander1, commander2], deckTheme: "custom" });
      }
    } catch (err) {
      toast.error("Error creating deck: " + err);
    }
  }

  return (
    <>
      <OverlayWrapper hideFn={() => setHideStateAction(false)}>
        <FullCardInfo cardName={cardName[0]!} />
        <Button onClick={createDeckClickHandler}>Create Deck</Button>
      </OverlayWrapper>
    </>
  );
}
