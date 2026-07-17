import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import CardFaceView from "@/components/cards/CardFaceView";
import ManaCost from "@/components/cards/ManaCost";
import Rulings from "@/components/cards/Ruling";
import Loader from "@/components/ui/Loader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useRemoveCardFromDeck, useUpdateCardQuantity, useUpdateCardPrinting } from "./useDeckQuery";
import { useUser } from "../user/useUser";
import { useCardQuery, usePrintingsQuery, useCardByTcgIdQuery } from "@/hooks/useScryfallQuery";
import type { DeckCardDetails } from "@/api/backendDeckApi";

interface Props {
  cardDetails: DeckCardDetails;
  quantity: number;
  onClose: () => void;
}

export default function CardDetailDialog({ cardDetails, quantity, onClose }: Props) {
  const { deckId } = useParams();
  const { idToken } = useUser();
  const { removeCard } = useRemoveCardFromDeck();
  const { updateCardQty } = useUpdateCardQuantity();
  const { updateCardPrinting } = useUpdateCardPrinting();

  const currentTcgId = cardDetails.card.id;
  const isCommander = cardDetails.commander;

  const [selectedTcgId, setSelectedTcgId] = useState<number>(currentTcgId);
  const [qty, setQty] = useState<number>(quantity);
  const [showRulings, setShowRulings] = useState(false);

  const { data: card, isPending, error } = useCardQuery(cardDetails.card.cardName);
  const { data: printings } = usePrintingsQuery(card?.oracle_id);

  const isDifferentPrinting = selectedTcgId !== currentTcgId;
  const { data: printingCard } = useCardByTcgIdQuery(isDifferentPrinting ? selectedTcgId : undefined);

  // Commit a printing change once the chosen printing resolves, then close.
  useEffect(() => {
    if (!isDifferentPrinting || !printingCard || printingCard.tcgplayer_id !== selectedTcgId) return;
    updateCardPrinting({ originalId: currentTcgId, newCard: printingCard });
    onClose();
  }, [isDifferentPrinting, printingCard, selectedTcgId, currentTcgId, updateCardPrinting, onClose]);

  function changeQty(delta: number) {
    if (isCommander) return;
    const next = Math.min(99, Math.max(1, qty + delta));
    setQty(next);
    updateCardQty({ cardId: currentTcgId, quantity: next });
  }

  function removeHandler() {
    removeCard({ deckId: deckId!, cardId: currentTcgId, idToken });
    onClose();
  }

  if (isPending) return <Loader />;
  if (error || !card) return <ErrorMessage msg={error ? error.message : "Failed to fetch card data"} />;

  const eur = card.prices?.eur;
  const usd = card.prices?.usd;

  return (
    <div className="w-[min(90vw,700px)]">
      {isDifferentPrinting ? (
        <Loader />
      ) : (
        <>
          <CardFaceView card={card} />
          <div className="mt-3 flex items-center gap-3">
            <ManaCost mana_cost={card.mana_cost} />
            {eur && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">&euro; {eur}</span>}
            {usd && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">$ {usd}</span>}
          </div>
          <div className="mt-3">
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowRulings((s) => !s)}
            >
              {showRulings ? "▾" : "▸"} Rulings
            </button>
            {showRulings && <Rulings rulingUri={card.rulings_uri} />}
          </div>
        </>
      )}

      {printings && printings.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Printing — choose artwork</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {printings.map((p) => {
              const selected = p.tcgplayer_id === selectedTcgId;
              return (
                <button
                  key={p.tcgplayer_id}
                  type="button"
                  onClick={() => setSelectedTcgId(p.tcgplayer_id)}
                  aria-label={`Select printing: ${p.setName}`}
                  aria-pressed={selected}
                  className="w-[70px] flex-shrink-0 cursor-pointer text-left"
                >
                  <img
                    src={p.imageUrl}
                    alt={`${p.setName} printing`}
                    data-testid="printing-thumb"
                    className={`h-[98px] w-full rounded-md border-2 ${selected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                  />
                  <span className={`mt-1 block truncate text-center text-[10px] ${selected ? "text-primary" : "text-muted-foreground"}`}>
                    {p.setName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs font-bold text-primary">In deck: &times;{qty}</span>
        {!isCommander && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
              <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(-1)} aria-label="decrease quantity">
                &minus;
              </button>
              <span className="w-9 text-center font-bold" data-testid="quantity">
                {qty}
              </span>
              <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(1)} aria-label="increase quantity">
                +
              </button>
            </div>
            <Button variant="destructive" onClick={removeHandler}>
              Remove from deck
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
