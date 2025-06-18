import { ScryfallApi, type MagicCard, type PrintingData } from "@/api/scryfallApi";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import MagicCardImage from "./MagicCardImage";
import Loader from "../ui/Loader";

const scryfallApi = new ScryfallApi();

interface Props {
  oracle_id: string;
  setCardFn: Dispatch<SetStateAction<MagicCard | null>>;
}

export default function ShowUniquePrintings({ oracle_id, setCardFn }: Props) {
  const [uniquePrintings, setUniquePrintings] = useState<PrintingData[]>([]);
  const [waitingForPrintings, setWaitingForPrintings] = useState<boolean>(false);

  useEffect(() => {
    async function getPrintings() {
      setWaitingForPrintings(true);
      const printings = await scryfallApi.getAllPrintings(oracle_id);
      setUniquePrintings(printings);
      setWaitingForPrintings(false);
    }

    getPrintings();
  }, [oracle_id]);

  async function setPrintingHandler(tcgId: number) {
    const card = await new ScryfallApi().getCardByTcgId(tcgId);
    setCardFn(card);
  }

  if (waitingForPrintings) return <Loader />;

  return (
    <div className="flex gap-2 justify-center flex-wrap my-10 overflow-auto">
      {uniquePrintings.map((card) => {
        return (
          <div onClick={() => setPrintingHandler(card.tcgplayer_id)}>
            <MagicCardImage key={card.tcgplayer_id} imageUrl={card.imageUrl} />
          </div>
        );
      })}
    </div>
  );
}
