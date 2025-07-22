import { BackendExploreAPI } from "@/api/backendExploreApi";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import { useGetTopCommanders } from "@/hooks/useEdhRecQuery";
import { useEffect } from "react";

export default function HomePage() {
  // const { isWaitingForTopCommanderYear, topCommanderYearError, topCommanderYear } = useGetTopCommanders("year");

  // if (isWaitingForTopCommanderYear) return <Loader />;
  // if (topCommanderYearError) return <ErrorMessage msg="Failed to load Top Commanders" />;

  // const listOfCards = topCommanderYear?.map((card) => card.name);
  // console.log(listOfCards)

  useEffect(() => {

    const test = async () => {
      new BackendExploreAPI().getBatchCardInfo(["HEllo", "BYe"])
    }

    test()
  }, [])

  return (
    <>

      <h1>Home</h1>
    </>
  );
}
