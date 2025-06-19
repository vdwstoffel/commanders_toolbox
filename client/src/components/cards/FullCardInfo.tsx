import { useEffect, useState } from "react";

import Loader from "../ui/Loader";
import SingleFacedCard from "./SingleFacedCard";
import DoubleFacedCard from "./DoubleFacedCard";
import AdventureCard from "./AdventureCard";
import MeldCard from "./MeldCard";
import Rulings from "./Ruling";

import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";

const scryfallApi = new ScryfallApi();

interface Props {
  cardName: string;
}

export default function FullCardInfo({ cardName }: Readonly<Props>) {
  const [card, setCard] = useState<MagicCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getCard() {
      setLoading(true);
      const cardDetails = await scryfallApi.getCardByName(cardName);
      setCard(cardDetails);
      setLoading(false);
    }

    getCard();
  }, [cardName]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      {card?.layout === "normal" && <SingleFacedCard card={card} />}
      {(card?.layout === "transform" || card?.layout === "modal_dfc") && <DoubleFacedCard card={card} />}
      {(card?.layout === "adventure" || card?.layout === "split") && <AdventureCard card={card} />}
      {card?.layout === "meld" && <MeldCard card={card} />}

      <div className="flex gap-3">
        <p>EUR: {card?.prices.eur}</p>
        <p>USD: {card?.prices.usd}</p>
      </div>

      <div>
        <div className="mt-4 text-right">
          <Rulings rulingUri={card!.rulings_uri} />
        </div>
      </div>
    </>
  );
}
