import { ScryfallApi } from "@/api/scryfallApi";
import FullCardInfo from "@/components/cards/FullCardInfo";
import { useCreateDeck } from "@/components/decks/useDeckQuery";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import OverlayWrapper from "@/components/ui/OverlayWrapper";
import { useGetTopCommanders } from "@/hooks/useExploreQuery";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface TopCommanderProps {
  period: "year" | "month" | "week";
}

export default function TopCommanderCourasel({ period }: TopCommanderProps) {
  const { isLoadingTopCommander, topCommanderError, topCommanderData } = useGetTopCommanders(period);
  const [showCardInfo, setShowCardInfo] = useState<boolean>(false);
  const [cardInfoToShow, setCardInfoToShow] = useState<string | null>(null);
  const { createDeck } = useCreateDeck();

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

  async function createDeckClickHandler() {
    const commander = await new ScryfallApi().getCardByName(cardInfoToShow!);
    createDeck({ deckName: cardInfoToShow!, commanders: [commander], deckTheme: "custom" });
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
          <Button onClick={createDeckClickHandler}>Create Deck</Button>
        </OverlayWrapper>
      )}
    </div>
  );
}
