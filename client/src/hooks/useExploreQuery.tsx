import { BackendExploreAPI } from "@/api/backendExploreApi";
import { EdhRecApi, type ColorIdentity } from "@/api/edhRecApi";
import { ScryfallApi } from "@/api/scryfallApi";
import { useQuery } from "@tanstack/react-query";

const edhRecApi = new EdhRecApi();
const backendExploreApi = new BackendExploreAPI();

export function useGetTopCommanders(period: "year" | "month" | "week") {
  // First get the data from edh rec
  const { data: topCommanderData } = useQuery({
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
    queryFn: () => backendExploreApi.getBatchCardInfo(commanderNames!),
    enabled: !!commanderNames?.length,
  });

  return {
    isLoadingTopCommander: waitingForTopCommanderCardInfo,
    topCommanderError: topCommanderTopCardInfoError,
    topCommanderData: topCommanderCardInfo,
  };
}

export function useGetCommandersByColor(color: ColorIdentity) {
  // First get the data from edh rec
  const { data: echData } = useQuery({
    queryKey: ["commanderColor", color],
    queryFn: () => edhRecApi.getCommanderByColor(color),
  });

  // Now that we have the data, isolate just the names
  const commanderNames = echData?.map((card) => card.name);

  // now get the card data from the backend
  const {
    isPending: waitingForCommanderByColor,
    error: commanderByColorError,
    data: commanderColorInfo,
  } = useQuery({
    queryKey: [`commanderColorInfo:${color}`, commanderNames],
    // queryFn: () => backendExploreApi.getBatchCardInfo(commanderNames!),
    queryFn: () => new ScryfallApi().getCollection(commanderNames!),
    enabled: !!commanderNames?.length,
  });

  return {
    waitingForCommanderByColor,
    commanderByColorError,
    commanderColorInfo,
  };
}
