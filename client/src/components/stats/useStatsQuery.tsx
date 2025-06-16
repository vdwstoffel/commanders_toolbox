import { useParams } from "react-router-dom";
import { useUser } from "../user/useUser";
import { BackendDeckApi } from "@/api/backendDeckApi";
import { useQuery } from "@tanstack/react-query";

const backendDeckApi = new BackendDeckApi();

export function useGetDeckColorDistribution() {
  const { deckId } = useParams();
  const { idToken } = useUser();

  const {
    isPending: isWaitingForColorDistribution,
    error: colorDistributionError,
    data: colorDistribution,
  } = useQuery({
    queryKey: ["colorDistribution"],
    queryFn: () => backendDeckApi.getColorDistributionByDeckId(deckId!, idToken),
  });

  return { isWaitingForColorDistribution, colorDistributionError, colorDistribution };
}
