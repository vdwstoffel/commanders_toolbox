import toast from "react-hot-toast";
import type { Dispatch, SetStateAction } from "react";
import { useParams } from "react-router-dom";

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
  const { theme } = useParams();
  const { createDeck } = useCreateDeck();

  async function createDeckClickHandler() {
    if (!cardName || cardName.length === 0) return;

    try {
      if (cardName.length === 1) {
        const commander = await new ScryfallApi().getCardByName(cardName[0]);
        createDeck({ deckName: cardName[0], commanders: [commander], deckTheme: theme || "custom" });
      } else {
        const [commander1, commander2] = await Promise.all([
          new ScryfallApi().getCardByName(cardName[0]),
          new ScryfallApi().getCardByName(cardName[1]),
        ]);
        createDeck({
          deckName: cardName[0] + "/" + cardName[1],
          commanders: [commander1, commander2],
          deckTheme: theme || "custom",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(`Error creating deck: ${errorMessage}`);
    }
  }

  return (
    <>
      <OverlayWrapper hideFn={() => setHideStateAction(false)}>
        <FullCardInfo cardName={cardName[0]} />
        <Button onClick={createDeckClickHandler}>Create Deck</Button>
      </OverlayWrapper>
    </>
  );
}
