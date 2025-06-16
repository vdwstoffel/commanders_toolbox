

import { type DeckCardDetails } from "../../api/backendDeckApi";
import CompactCardInfo from "./CompactCardInfo";

interface Props {
  heading: string;
  cards: DeckCardDetails[];
  hoverFunc: (url: string) => void;
}

export default function CardTypeContainer({ heading, cards, hoverFunc }: Props) {
  return (
    <div key={heading} className="mb-4 break-inside-avoid-column">
      <p className="text-lg font-bold border-b-2 border-slate-400/30">{heading}</p>
      {cards.map((card) => (
         <div key={card.id} onMouseEnter={() => hoverFunc(card.card.cardImageUrl[0])}>
        <CompactCardInfo key={card.id} cardDetails={card} quantity={card.quantity} />
        </div>
      ))}
    </div>
  );
}