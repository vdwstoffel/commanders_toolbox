/**
 * Compact component showing the card name the quantity of the card in the cards mana symbols
 * example:     1 Muldrotha, the Gravetide 3BUG
 */

import { TiDelete } from "react-icons/ti";
import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DeckCardDetails } from "@/api/backendDeckApi";
import { useRemoveCardFromDeck, useUpdateCardQuantity } from "./useDeckQuery";
import { useUser } from "../user/useUser";
import FullCardInfo from "../cards/FullCardInfo";
import OverlayWrapper from "../ui/OverlayWrapper";

interface CompactCardInfoProps {
  cardDetails: DeckCardDetails;
  quantity: number;
}

export default function CompactCardInfo({ cardDetails, quantity }: CompactCardInfoProps) {
  const { deckId } = useParams();
  const { idToken } = useUser();
  const { removeCard } = useRemoveCardFromDeck();
  const { updateCardQty } = useUpdateCardQuantity();
  const [showCardInfo, setShowCardInfo] = useState<boolean>(false);
  //State for editing quantity
  const [inEditMode, setInEditMode] = useState<boolean>(false);
  const [tempQty, setTempQty] = useState<number>(quantity);
  const inputRef = useRef<HTMLInputElement>(null);

  const card = cardDetails.card;

  const cleanedUris =
    card.manaSymbolUris[card.manaSymbolUris.length - 1] === "//" ? card.manaSymbolUris.slice(0, -1) : card.manaSymbolUris;

  function removeCardFromDeckHandler() {
    removeCard({ deckId: deckId!, cardId: card.id, idToken });
  }

  function toggleShowCardInfoHandler() {
    setShowCardInfo(!showCardInfo);
  }

  function editTempQtyHandler(e: ChangeEvent<HTMLInputElement>) {
    if (Number.isNaN(Number(e.target.value))) return;
    setTempQty(Number(e.target.value));
  }

  function editModeHandler() {
    setInEditMode(true);
  }

  const handleExitInput = useCallback(() => {
    if (cardDetails.commander) {
      setInEditMode(false);
      return;
    }

    updateCardQty({ cardId: cardDetails.card.id, quantity: tempQty });
    setInEditMode(false);
    setTempQty(tempQty);
  }, [cardDetails.commander, cardDetails.card.id, tempQty, updateCardQty]);

  function exitEditMode(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setInEditMode(false);
      setTempQty(quantity);
    }
    if (e.key === "Enter") {
      handleExitInput();
    }
  }

  return (
    <div className="grid gap-4 w-auto grid-cols-[0.5fr_10fr_5fr_0.5fr] hover:cursor-pointer items-center">
      {inEditMode ? (
        <input
          ref={inputRef}
          className="my-auto h-4 w-6 p-1"
          value={tempQty}
          max="99"
          onChange={editTempQtyHandler}
          onBlur={handleExitInput}
          onKeyDown={exitEditMode}
        />
      ) : (
        <p className="text-sm" onDoubleClick={editModeHandler}>
          {quantity}
        </p>
      )}
      <p onClick={toggleShowCardInfoHandler}>{card.cardName}</p>
      <div className="flex w-3 justify-start gap-0.5">
        {cleanedUris.map((uri: string, idx: number) =>
          uri != "//" ? <img key={idx} src={uri} alt="manaSymbol" /> : <span key={idx}>//</span>
        )}
      </div>

      {!cardDetails.commander && <TiDelete className="text-red-700" onClick={removeCardFromDeckHandler} />}
      {showCardInfo && (
        <OverlayWrapper>
          <FullCardInfo cardName={card.cardName} exitHandler={toggleShowCardInfoHandler} />
        </OverlayWrapper>
      )}
    </div>
  );
}
