import type { ColorIdentity } from "@/api/edhRecApi";
import { useGetCommandersByColor } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import { useState } from "react";
import InfoAndCreateOverlay from "./InfoAndCreateOverlay";

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

  console.log(commanderColorInfo);

  return (
    <div className="flex flex-wrap gap-2 py-5">
      {commanderColorInfo?.map((card) => {
        const cardImage = card.image_uris ? card.image_uris.large : card.card_faces![0].image_uris.large;
        return <img src={cardImage} className="w-60" onClick={() => imageClickHandler(card.name)} />;
      })}
      {showInfo && <InfoAndCreateOverlay cardName={cardName!} setHideStateAction={setShowInfo} />}
    </div>
  );
}
