import { useState } from "react";

import { Button } from "@/components/ui/button";
import CardFaceView from "@/components/cards/CardFaceView";
import ManaCost from "@/components/cards/ManaCost";
import Rulings from "@/components/cards/Ruling";
import Loader from "@/components/ui/Loader";
import { useAddCardToDeck } from "./useDeckQuery";
import { useCardByTcgIdQuery, usePrintingsQuery } from "@/hooks/useScryfallQuery";
import type { MagicCard } from "@/api/scryfallApi";
import type { DeckCardDetails } from "@/api/backendDeckApi";

interface Props {
  card: MagicCard;
  deckColorIdentity: string;
  commanderNames: string[];
  deckCards: DeckCardDetails[];
  onClose: () => void;
}

export default function AddCardDialog({ card, deckColorIdentity, commanderNames, deckCards, onClose }: Props) {
  const { addingCard, addCard } = useAddCardToDeck();
  const [selectedTcgId, setSelectedTcgId] = useState<number | undefined>(card.tcgplayer_id);
  const [quantity, setQuantity] = useState(1);
  const [showRulings, setShowRulings] = useState(false);

  const { data: printings } = usePrintingsQuery(card.oracle_id);
  const isDifferentPrinting = !!selectedTcgId && selectedTcgId !== card.tcgplayer_id;
  const { data: printingCard, isPending: loadingPrinting } = useCardByTcgIdQuery(isDifferentPrinting ? selectedTcgId : undefined);
  const displayCard: MagicCard = isDifferentPrinting && printingCard ? printingCard : card;

  const inDeckCount = deckCards
    .filter((dc) => dc.card.cardName === displayCard.name)
    .reduce((sum, dc) => sum + dc.quantity, 0);

  const offColor = displayCard.color_identity.some((c) => !deckColorIdentity.includes(c));
  const isCommander = commanderNames.includes(displayCard.name);
  const blockedReason = offColor
    ? `${displayCard.name} is not in the deck's color identity`
    : isCommander
      ? "Cannot add the commander to the deck"
      : null;

  function changeQty(delta: number) {
    setQuantity((q) => Math.min(99, Math.max(1, q + delta)));
  }

  function addHandler() {
    if (blockedReason) return;
    addCard({ card: displayCard, quantity });
    setQuantity(1);
    onClose();
  }

  const eur = displayCard.prices?.eur;
  const usd = displayCard.prices?.usd;

  return (
    <div className="w-[min(90vw,700px)]">
      {isDifferentPrinting && loadingPrinting ? (
        <Loader />
      ) : (
        <>
          <CardFaceView card={displayCard} />
          <div className="mt-3 flex items-center gap-3">
            <ManaCost mana_cost={displayCard.mana_cost} />
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
            {showRulings && <Rulings rulingUri={displayCard.rulings_uri} />}
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

      {blockedReason && <p className="mt-3 font-bold text-destructive">{blockedReason}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs font-bold text-primary">
          {inDeckCount > 0 ? `In deck: ×${inDeckCount}` : "Not in deck"}
        </span>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
            <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(-1)} aria-label="decrease quantity">
              &minus;
            </button>
            <span className="w-9 text-center font-bold" data-testid="quantity">
              {quantity}
            </span>
            <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(1)} aria-label="increase quantity">
              +
            </button>
          </div>
          <Button onClick={addHandler} disabled={!!blockedReason || addingCard}>
            {addingCard ? "Adding…" : "+ Add to Deck"}
          </Button>
        </div>
      </div>
    </div>
  );
}
