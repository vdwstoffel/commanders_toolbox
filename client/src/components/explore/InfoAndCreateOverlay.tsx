import toast from "react-hot-toast";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import FullCardInfo from "../cards/FullCardInfo";
import OverlayWrapper from "../ui/OverlayWrapper";
import { useCreateDeck } from "../decks/useDeckQuery";
import { ScryfallApi } from "@/api/scryfallApi";

interface Props {
  cardName: string;
  setHideStateAction: Dispatch<SetStateAction<boolean>>;
}

export default function InfoAndCreateOverlay({ cardName, setHideStateAction }: Props) {
  const { createDeck } = useCreateDeck();

  async function createDeckClickHandler() {
    if (!cardName) return;

    try {
      const commander = await new ScryfallApi().getCardByName(cardName);
      createDeck({ deckName: cardName, commanders: [commander], deckTheme: "custom" });
    } catch (err) {
      toast.error("Error creating deck: " + err);
    }
  }

  return (
    <>
      <OverlayWrapper hideFn={() => setHideStateAction(false)}>
        <FullCardInfo cardName={cardName!} />
        <Button onClick={createDeckClickHandler}>Create Deck</Button>
      </OverlayWrapper>
    </>
  );
}
