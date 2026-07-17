import { useQuery } from "@tanstack/react-query";

import { ScryfallApi } from "@/api/scryfallApi";

const scryfallApi = new ScryfallApi();

export function useCardQuery(cardName: string) {
  return useQuery({
    queryKey: ["scryfallCard", cardName],
    queryFn: () => scryfallApi.getCardByName(cardName),
    enabled: !!cardName,
    staleTime: Infinity,
  });
}

export function useCardByTcgIdQuery(tcgId: number | undefined) {
  return useQuery({
    queryKey: ["scryfallCardTcg", tcgId],
    queryFn: () => scryfallApi.getCardByTcgId(tcgId!),
    enabled: !!tcgId,
    staleTime: Infinity,
  });
}

export function usePrintingsQuery(oracleId: string | undefined) {
  return useQuery({
    queryKey: ["scryfallPrintings", oracleId],
    queryFn: () => scryfallApi.getAllPrintings(oracleId!),
    enabled: !!oracleId,
    staleTime: Infinity,
  });
}

export function useCardRulingsQuery(rulingsUri: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["scryfallRulings", rulingsUri],
    queryFn: () => scryfallApi.getCardRulings(rulingsUri!),
    enabled: enabled && !!rulingsUri,
    staleTime: Infinity,
  });
}
