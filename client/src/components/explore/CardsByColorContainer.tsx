import type { ColorIdentity } from "@/api/edhRecApi";
import { useGetCommandersByColor } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import { useState } from "react";
import InfoAndCreateOverlay from "./InfoAndCreateOverlay";
import MagicCardImage from "../cards/MagicCardImage";

export default function CardsByColorContainer({ color }: { color: ColorIdentity }) {
  const { waitingForCommanderByColor, commanderByColorError, commanderColorInfo } = useGetCommandersByColor(color);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [cardName, setCardName] = useState<string | null>(null);

  if (waitingForCommanderByColor) return <Loader />;
  if (commanderByColorError) return <ErrorMessage msg="Failed to load commander data" />;

  function imageClickHandler(cardName: string) {
    setCardName(cardName);
    setShowInfo(true);
  }

  return (
    <div className="flex flex-wrap gap-2 py-5">
      {commanderColorInfo?.map((card) => {
        if (card.length === 1) {
          return <MagicCardImage imageUrl={card[0].cardImage} clickFunction={() => imageClickHandler(card[0].name)} />;
        } else {
          return (
            <div className="flex flex-col">
              <img src={card[0].cardImage} className="w-60 h-40" onClick={() => imageClickHandler(card[0].name)} />
              <img src={card[1].cardImage} className="w-60 h-40" onClick={() => imageClickHandler(card[1].name)} />
            </div>
          );
        }
      })}
      {showInfo && <InfoAndCreateOverlay cardName={cardName!} setHideStateAction={setShowInfo} />}
    </div>
  );
}
6