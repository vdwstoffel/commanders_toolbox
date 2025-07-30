import type { ColorIdentity } from "@/api/edhRecApi";
import { useGetCommandersByColor } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import CardByCollectionContainer from "./CardsByCollectionContainer";

export default function CardsByColor({ color }: { color: ColorIdentity }) {
  const { waitingForCommanderByColor, commanderByColorError, commanderColorInfo } = useGetCommandersByColor(color);

  if (waitingForCommanderByColor) return <Loader />;
  if (commanderByColorError) return <ErrorMessage msg="Failed to load commander data" />;

  return <CardByCollectionContainer cardCollection={commanderColorInfo!} />;
}
