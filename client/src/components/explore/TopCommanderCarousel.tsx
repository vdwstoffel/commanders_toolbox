import { useState } from "react";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import { useGetTopCommanders } from "@/hooks/useExploreQuery";
import InfoAndCreateOverlay from "./InfoAndCreateOverlay";

interface TopCommanderProps {
  period: "year" | "month" | "week";
}

export default function TopCommanderCarousel({ period }: TopCommanderProps) {
  const { isLoadingTopCommander, topCommanderError, topCommanderData } = useGetTopCommanders(period);
  const [showCardInfo, setShowCardInfo] = useState<boolean>(false);
  const [cardInfoToShow, setCardInfoToShow] = useState<string | null>(null);

  if (isLoadingTopCommander) return <Loader />;
  if (topCommanderError) return <ErrorMessage msg={topCommanderError.message} />;

  function toggleCardInfo(cardName?: string) {
    setShowCardInfo(!showCardInfo);

    if (cardInfoToShow === null && cardName) {
      setCardInfoToShow(cardName);
    } else {
      setCardInfoToShow(null);
    }
  }

  if (!topCommanderData) return <ErrorMessage msg="No commander data available" />;

  return (
    <div className="flex flex-col mx-20 border border-amber-50">
      <Carousel>
        <CarouselContent>
          {topCommanderData.map((card) => {
            return (
              <CarouselItem
                key={card.id}
                onClick={() => toggleCardInfo(card.cardName)}
                onKeyDown={(e) => e.key === "Enter" && toggleCardInfo(card.cardName)}
                className="basis-1/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                tabIndex={0}
                role="button"
                aria-label={`View details for ${card.cardName}`}
              >
                <img className="w-60" src={card.cardImageUrl[0]} alt={`${card.cardName} card image`} />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      {showCardInfo && <InfoAndCreateOverlay cardName={[cardInfoToShow!]} setHideStateAction={setShowCardInfo} />}
    </div>
  );
}
