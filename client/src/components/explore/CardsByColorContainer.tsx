import type { ColorIdentity } from "@/api/edhRecApi";
import { useGetCommandersByColor } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";

export default function CardsByColorContainer({ color }: { color: ColorIdentity }) {
  const { waitingForCommanderByColor, commanderByColorError, commanderColorInfo } = useGetCommandersByColor(color);

  if (waitingForCommanderByColor) return <Loader />;
  if (commanderByColorError) return <ErrorMessage msg="Failed to load commander data" />;
  return (
    <div className="flex flex-wrap gap-2 py-5">
      {commanderColorInfo?.map((card) => (
        <img src={card.cardImageUrl[0]} className="w-60" />
      ))}
    </div>
  );
}
