import { ScryfallApi, type MagicCard, type PrintingData } from "@/api/scryfallApi";
import type { Dispatch, SetStateAction } from "react";
import MagicCardImage from "./MagicCardImage";

interface Props {
  printingData: PrintingData[];
  setCardFn: Dispatch<SetStateAction<MagicCard | null>>;
}

export default function ShowUniquePrintings({ printingData, setCardFn }: Props) {
  async function setPrintingHandler(tcgId: number) {
    const card = await new ScryfallApi().getCardByTcgId(tcgId);
    setCardFn(card);
  }

  return (
    <div className="flex gap-2 justify-center flex-wrap mt-30 my-10 py-10 overflow-auto max-h-screen">
      {printingData.map((card) => {
        return (
          <div onClick={() => setPrintingHandler(card.tcgplayer_id)}>
            <MagicCardImage key={card.tcgplayer_id} imageUrl={card.imageUrl} />
          </div>
        );
      })}
    </div>
  );
}
