import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

export default function AddCardDialog({ card, deckColorIdentity, commanderNames, deckCards }: Props) {
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

      {blockedReason && <p className="mt-3 font-bold text-destructive">{blockedReason}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary">
            {inDeckCount > 0 ? `In deck: ×${inDeckCount}` : "Not in deck"}
          </span>
          {printings && printings.length > 1 && (
            <Select value={String(selectedTcgId)} onValueChange={(v) => setSelectedTcgId(Number(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Printing" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  {printings.map((p) => (
                    <SelectItem key={p.tcgplayer_id} value={String(p.tcgplayer_id)}>
                      {p.setName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
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
