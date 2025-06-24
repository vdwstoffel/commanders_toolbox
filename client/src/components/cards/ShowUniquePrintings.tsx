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
    <div className="flex gap-2 justify-center flex-wrap my-10 overflow-auto">
      {uniquePrintings.map((card, idx) => {
        return (
          <div onClick={() => setPrintingHandler(card.tcgplayer_id)}>
            <MagicCardImage key={card.tcgplayer_id + idx} imageUrl={card.imageUrl} />
          </div>
        );
      })}
    </div>
  );
}
