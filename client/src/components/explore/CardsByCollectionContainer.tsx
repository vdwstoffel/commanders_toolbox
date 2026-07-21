import { useState } from "react";

import type { ExploreCardInfo } from "@/hooks/useExploreQuery";
import MagicCardImage from "../cards/MagicCardImage";
import DualCommanderContainer from "./DualCommanderContainer";
import InfoAndCreateOverlay from "./InfoAndCreateOverlay";

interface Props {
  cardCollection: ExploreCardInfo[][];
}

export default function CardByCollectionContainer({ cardCollection }: Props) {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [cardName, setCardName] = useState<string[]>([]);

  function imageClickHandler(cardName: string[]) {
    setCardName(cardName);
    setShowInfo(true);
  }

  return (
    <div className="my-5 flex flex-wrap items-start justify-center gap-4">
      {cardCollection?.map((card, idx) => {
        if (card.length === 1) {
          return (
            <div
              key={card[0].name + idx}
              role="button"
              tabIndex={0}
              aria-label={`View ${card[0].name}`}
              onClick={() => imageClickHandler([card[0].name])}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  imageClickHandler([card[0].name]);
                }
              }}
              className="cursor-pointer rounded-xl transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <MagicCardImage imageUrl={card[0].cardImage} />
            </div>
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
      {showInfo && <InfoAndCreateOverlay cardName={cardName} setHideStateAction={setShowInfo} />}
    </div>
  );
}
