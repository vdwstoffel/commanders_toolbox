import { IoCloseCircleSharp } from "react-icons/io5";

import {Button} from "../ui/button";
import OverlayWrapper from "../ui/OverlayWrapper";
import { useAddCardToDeck } from "./useDeckQuery";
import { type MagicCard } from "@/api/scryfallApi"; 

interface Props {
  cardData: MagicCard;
  closeFn: () => void;
}

export default function CardInfoOverlay({ cardData, closeFn }: Props) {
  const { addCard } = useAddCardToDeck();

  function addToDeckHandler() {
    addCard(cardData);
    closeFn();
  }

  return (
    <OverlayWrapper hideFn={closeFn}>
      <div className="mx-auto mt-20 w-fit rounded-md bg-slate-200/80 p-5 text-center">
        <div className="w-full">
          <div className="mx-auto w-fit">
            <IoCloseCircleSharp className="right-0 text-2xl text-red-600 hover:cursor-pointer" onClick={closeFn} />
          </div>
        </div>
        <h1>{cardData.name}</h1>
        {cardData.image_uris ? (
          <img src={cardData.image_uris.large} className="w-72" />
        ) : (
          <div className="flex gap-2">
            <img src={cardData.card_faces![0].image_uris.large} className="w-72" />
            <img src={cardData.card_faces![1].image_uris.large} className="w-72" />
          </div>
        )}
        <p>
          EUR: {cardData.prices.eur} USD: {cardData.prices.usd}
        </p>

        <Button onClick={addToDeckHandler}>Add to deck</Button>
      </div>
    </OverlayWrapper>
  );
}