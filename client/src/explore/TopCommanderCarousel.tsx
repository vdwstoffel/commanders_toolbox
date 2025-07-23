import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import { useGetTopCommanders } from "@/hooks/useExploreQuery";

interface TopCommanderProps {
  period: "year" | "month" | "week";
}

export default function TopCommanderCourasel({ period }: TopCommanderProps) {
  const { isLoadingTopCommander, topCommanderError, topCommanderData } = useGetTopCommanders(period);

  if (isLoadingTopCommander) return <Loader />;
  if (topCommanderError) return <ErrorMessage msg={topCommanderError.message} />;

  return (
    <div className="flex flex-col mx-20 border border-amber-50">
      <Carousel>
        <CarouselContent>
          {topCommanderData!.map((card) => {
            return (
              <CarouselItem key={card.id} className="basis-1/10">
                <img className="w-60" src={card.cardImageUrl[0]} />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
