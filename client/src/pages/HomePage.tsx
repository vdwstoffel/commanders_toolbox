import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import { useGetTopCommanders } from "@/hooks/useExploreQuery";

export default function HomePage() {
  const { isLoadingTopCommander, topCommanderError, topCommanderData } = useGetTopCommanders("year");

  if (isLoadingTopCommander) return <Loader />;
  if (topCommanderError) return <ErrorMessage msg={topCommanderError.message} />;

  return (
    <>
      {topCommanderData!.map((card) => (
        <img className="w-30" src={card.cardImageUrl[0]} />
      ))}
      <h1>Home</h1>
    </>
  );
}
