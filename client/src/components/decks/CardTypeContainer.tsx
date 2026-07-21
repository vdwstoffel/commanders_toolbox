

import { type DeckCardDetails } from "../../api/backendDeckApi";
import CompactCardInfo from "./CompactCardInfo";

interface Props {
  heading: string;
  cards: DeckCardDetails[];
  hoverFunc: (url: string) => void;
}

export default function CardTypeContainer({ heading, cards, hoverFunc }: Props) {
  const cardCount = cards.reduce((sum, card) => sum + card.quantity, 0);
  return (
    <div key={heading} className="mb-4 break-inside-avoid-column">
      <p className="flex items-baseline justify-between border-b-2 border-border text-lg font-bold">
        <span>{heading.trim()}</span>
        <span className="text-sm font-normal text-muted-foreground">{cardCount}</span>
      </p>
      {cards.map((card) => (
         <div key={card.id} onMouseEnter={() => hoverFunc(card.card.cardImageUrl[0])}>
        <CompactCardInfo key={card.id} cardDetails={card} quantity={card.quantity} />
        </div>
      ))}
    </div>
  );
}