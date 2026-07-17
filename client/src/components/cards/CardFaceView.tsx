import type { MagicCard } from "@/api/scryfallApi";
import SingleFacedCard from "./SingleFacedCard";
import DoubleFacedCard from "./DoubleFacedCard";
import AdventureCard from "./AdventureCard";
import MeldCard from "./MeldCard";

export default function CardFaceView({ card }: { card: MagicCard }) {
  return (
    <>
      {card.layout === "normal" && <SingleFacedCard card={card} />}
      {(card.layout === "transform" || card.layout === "modal_dfc") && <DoubleFacedCard card={card} />}
      {(card.layout === "adventure" || card.layout === "split") && <AdventureCard card={card} />}
      {card.layout === "meld" && <MeldCard card={card} />}
    </>
  );
}
