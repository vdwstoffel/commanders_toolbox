import { useQuery } from "@tanstack/react-query";

import { EdhRecApi } from "@/api/edhRecApi";

const edhRecApi = new EdhRecApi();

export function useGetTopCommanders(period: "year" | "month" | "week") {
  const {
    isPending: isWaitingForTopCommanderYear,
    error: topCommanderYearError,
    data: topCommanderYear,
  } = useQuery({
    queryKey: ["topCommandersYear"],
    queryFn: () => edhRecApi.getTopCommander(period),
  });

  return { isWaitingForTopCommanderYear, topCommanderYearError, topCommanderYear };
}
