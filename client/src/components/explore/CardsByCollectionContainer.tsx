import { useState } from "react";

import type { ExploreCardInfo } from "@/hooks/useExploreQuery";
import MagicCardImage from "../cards/MagicCardImage";
import DualCommanderContainer from "./DaulCommanderContainer";
import InfoAndCreateOverlay from "./InfoAndCreateOverlay";

interface Props {
  cardCollection: ExploreCardInfo[][];
}

export default function CardByCollectionContainer({ cardCollection }: Props) {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [cardName, setCardName] = useState<string[] | null>(null);

  function imageClickHandler(cardName: string[]) {
    setCardName(cardName);
    setShowInfo(true);
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center my-5">
      {cardCollection?.map((card, idx) => {
        if (card.length === 1) {
          return (
            <MagicCardImage
              key={card[0].name + idx}
              imageUrl={card[0].cardImage}
              clickFunction={() => imageClickHandler([card[0].name])}
            />
          );
        } else {
          return (
            <DualCommanderContainer
              key={card[0].name + idx}
              cardImageOneImageUrl={card[0].cardImage}
              cardImageTwoImageUrl={card[1].cardImage}
              clickFunction={() => imageClickHandler([card[0].name, card[1].name])}
            />
          );
        }
      })}
      {showInfo && <InfoAndCreateOverlay cardName={cardName!} setHideStateAction={setShowInfo} />}
    </div>
  );
}
