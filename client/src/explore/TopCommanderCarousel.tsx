import FullCardInfo from "@/components/cards/FullCardInfo";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import OverlayWrapper from "@/components/ui/OverlayWrapper";
import { useGetTopCommanders } from "@/hooks/useExploreQuery";
import { useState } from "react";

interface TopCommanderProps {
  period: "year" | "month" | "week";
}

export default function TopCommanderCourasel({ period }: TopCommanderProps) {
  const { isLoadingTopCommander, topCommanderError, topCommanderData } = useGetTopCommanders(period);
  const [showCardInfo, setShowCardInfo] = useState<boolean>(false);
  const [cardInfoToShow, setCardInfoToShow] = useState<string | null>(null);

  if (isLoadingTopCommander) return <Loader />;
  if (topCommanderError) return <ErrorMessage msg={topCommanderError.message} />;

  function toggleCardInfo(cardName?: string) {
    setShowCardInfo(!showCardInfo);

    if (cardInfoToShow === null) {
      setCardInfoToShow(cardName!);
    } else {
      setCardInfoToShow(null);
    }
  }

  return (
    <div className="flex flex-col mx-20 border border-amber-50">
      <Carousel>
        <CarouselContent>
          {topCommanderData!.map((card) => {
            return (
              <CarouselItem key={card.id} onClick={() => toggleCardInfo(card.cardName)} className="basis-1/10">
                <img className="w-60" src={card.cardImageUrl[0]} />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      {showCardInfo && (
        <OverlayWrapper hideFn={toggleCardInfo}>
          <FullCardInfo cardName={cardInfoToShow!} />
        </OverlayWrapper>
      )}
    </div>
  );
}
