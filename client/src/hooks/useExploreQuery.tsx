import { BackendExploreAPI } from "@/api/backendExploreApi";
import { EdhRecApi } from "@/api/edhRecApi";
import { useQuery } from "@tanstack/react-query";

const edhRecApi = new EdhRecApi();
const backendExploreApi = new BackendExploreAPI();

export function useGetTopCommanders(period: "year" | "month" | "week") {
  // First get the data from edh rec
  const {
    isPending: isLoadingTopCommanderData,
    error: TopCommanderError,
    data: topCommanderData,
  } = useQuery({
    queryKey: ["topCommander", period],
    queryFn: () => edhRecApi.getTopCommander(period),
  });

  // Now that we have the data, isolate just the names
  const commanderNames = topCommanderData?.map((card) => card.name);

  // now get the card data from the backend
  const {
    isPending: waitingForTopCommanderCardInfo,
    error: topCommanderTopCardInfoError,
    data: topCommanderCardInfo,
  } = useQuery({
    queryKey: ["topCommanderCardData", commanderNames],
    queryFn: () => backendExploreApi.getBatchCardInfo(commanderNames),
    enabled: !!commanderNames?.length,
  });

  console.log(topCommanderCardInfo);

  return {
    isLoadingTopCommander: waitingForTopCommanderCardInfo,
    topCommanderError: topCommanderTopCardInfoError,
    topCommanderData: topCommanderCardInfo,
  };
}
