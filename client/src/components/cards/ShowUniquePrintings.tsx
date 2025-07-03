import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

import { ScryfallApi, type MagicCard, type PrintingData } from "@/api/scryfallApi";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import MagicCardImage from "./MagicCardImage";
import Loader from "../ui/Loader";

const scryfallApi = new ScryfallApi();

interface Props {
  cardName: string;
  setCardFn: Dispatch<SetStateAction<MagicCard | null>>;
}

export default function ShowUniquePrintings({ cardName, setCardFn }: Props) {
  const [uniquePrintings, setUniquePrintings] = useState<PrintingData[]>([]);
  const [waitingForPrintings, setWaitingForPrintings] = useState<boolean>(false);

  useEffect(() => {
    async function getPrintings() {
      setWaitingForPrintings(true);
      const card = await scryfallApi.getCardByName(cardName);
      const printings = await scryfallApi.getAllPrintings(card.oracle_id);
      setUniquePrintings(printings);
      setWaitingForPrintings(false);
    }

    getPrintings();
  }, [cardName]);

  async function setPrintingHandler(cardName: number) {
    const card = await scryfallApi.getCardByTcgId(cardName);
    setCardFn(card);
  }

  if (waitingForPrintings) return <Loader />;

  return (
    <div className="p-10">
      <Carousel>
        <CarouselContent>
          {uniquePrintings.map((card, idx) => {
            return (
              <CarouselItem key={idx} className="basis-1/3">
                <div onClick={() => setPrintingHandler(card.tcgplayer_id)}>
                  <MagicCardImage key={card.tcgplayer_id + idx} imageUrl={card.imageUrl} />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
