import { useEffect, useRef, useState } from "react";

import Loader from "../ui/Loader";
import SingleFacedCard from "./SingleFacedCard";
import DoubleFacedCard from "./DoubleFacedCard";
import AdventureCard from "./AdventureCard";
import MeldCard from "./MeldCard";
import Rulings from "./Ruling";

import { ScryfallApi ,type MagicCard } from "@/api/scryfallApi";



interface Props {
  cardName: string;
  exitHandler: () => void;
}


const scryfallApi = new ScryfallApi();

export default function FullCardInfo({ cardName, exitHandler }: Readonly<Props>) {
  const ref = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        exitHandler();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick);
  }, [exitHandler]);

  useEffect(() => {
    function escapeHandler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        exitHandler();
      }
    }

    document.addEventListener("keydown", escapeHandler, true);
    return () => document.removeEventListener("keydown", escapeHandler);
  }, [exitHandler]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div ref={ref} className="max-h-screen overflow-auto rounded-lg bg-neutral-900/80 p-10 text-neutral-200">
      {(card?.layout === "normal") && <SingleFacedCard card={card} />}
      {(card?.layout === "transform" || card?.layout === "modal_dfc") && <DoubleFacedCard card={card} />}
      {(card?.layout === "adventure" || card?.layout === "split") && <AdventureCard card={card} />}
      {card?.layout === "meld" && <MeldCard card={card} />}
      
      <div>
        <div className="mt-4 text-right">
          <Rulings rulingUri={card!.rulings_uri} />
        </div>
      </div>
    </div>
  );
}
