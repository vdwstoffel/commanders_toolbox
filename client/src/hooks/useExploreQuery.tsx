import { BackendExploreAPI } from "@/api/backendExploreApi";
import { EdhRecApi, type ColorIdentity } from "@/api/edhRecApi";
import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";
import { useQuery } from "@tanstack/react-query";

const edhRecApi = new EdhRecApi();
const backendExploreApi = new BackendExploreAPI();

/**
 * HELPER FUNCTION
 */

/**
 * Takes an array of objects with the key name and the value of the resolved name
 * @param cardName
 * @returns A list of unique strings
 */
function getUniqueCardNames(cardName: { name: string }[]) {
  const uniqueNames = new Set<string>();
  // Now that we have the data, isolate just the names
  cardName?.forEach((card) => {
    if (card.name.includes("//")) {
      const bothCardNames = card.name.split("//");
      uniqueNames.add(bothCardNames[0].trim());
      uniqueNames.add(bothCardNames[1].trim());
    } else {
      uniqueNames.add(card.name);
    }
  });
  return [...uniqueNames];
}

function formatCardData(rawCardData: MagicCard[], originalEdhRecData: string[]) {
  // format the info to match dual commander if any, return an object with card names and card images
  const cardData: ExploreCardInfo[][] = [];

  if (!rawCardData || !originalEdhRecData) return [];

  originalEdhRecData.forEach((card) => {
    // Check if it is dual commander or not
    const possibleCards = card.split("//").map((card) => card.trim());

    if (possibleCards.length === 1) {
      const cardInfo = rawCardData.filter((card) => card.name.split("//")[0].trim() === possibleCards[0]);
      if (cardInfo.length === 0) return; // for each does not support continue, use return instead
      cardData.push([
        {
          name: cardInfo[0].name,
          cardImage: cardInfo[0].image_uris ? cardInfo[0].image_uris.large : cardInfo[0].card_faces![0].image_uris.large,
        },
      ]);
    } else {
      const partners: ExploreCardInfo[] = [];
      const partner1 = rawCardData.filter((card) => card.name.split("//")[0].trim() === possibleCards[0]);
      const partner2 = rawCardData.filter((card) => card.name.split("//")[0].trim() === possibleCards[1]);
      if (partner1.length === 0 || partner2.length === 0) return;
      partners.push({
        name: partner1[0].name,
        cardImage: partner1[0].image_uris ? partner1[0].image_uris.large : partner1[0].card_faces![0].image_uris.large,
      });
      partners.push({
        name: partner2[0].name,
        cardImage: partner2[0].image_uris ? partner2[0].image_uris.large : partner2[0].card_faces![0].image_uris.large,
      });
      cardData.push(partners);
    }
  });
  return cardData;
}

export interface ExploreCardInfo {
  name: string;
  cardImage: string;
}

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
  const { data: edhData, error: edhError } = useQuery({
    queryKey: ["commanderColor", color],
    queryFn: () => edhRecApi.getCommanderByColor(color),
  });

  const commanderNames = edhData ? getUniqueCardNames(edhData) : [];

  // now get the card data from scryfall
  const {
    isPending: waitingForCommanderByColor,
    error: commanderByColorError,
    data: commanderColorInfo,
  } = useQuery({
    queryKey: [`commanderColorInfo:${color}`, commanderNames],
    queryFn: () => new ScryfallApi().getCollection(commanderNames!),
    enabled: !!commanderNames?.length,
  });

  const originalEdhCardPairings = edhData?.map((card) => card.name);
  const formattedData =
    commanderColorInfo && originalEdhCardPairings ? formatCardData(commanderColorInfo, originalEdhCardPairings) : [];

  return {
    waitingForCommanderByColor,
    commanderByColorError: edhError || commanderByColorError,
    commanderColorInfo: formattedData,
  };
}

export function useGetThemesOverview(overview: "themes" | "typal") {
  const {
    isPending: isPendingThemesOverview,
    error: themesOverviewError,
    data: themesOverview,
  } = useQuery({
    queryKey: ["themes", overview],
    queryFn: () => edhRecApi.getThemeOrTribeOverview(overview),
  });

  return { isPendingThemesOverview, themesOverviewError, themesOverview };
}

export function useGetCardsByTheme(theme: string) {
  const { data: cardsByThemeEdh, error: cardsByThemeErrorEdh } = useQuery({
    queryKey: ["cardsByTheme", theme],
    queryFn: () => edhRecApi.getThemeOrTribeCards(theme),
  });

  const commanderNames = cardsByThemeEdh ? getUniqueCardNames(cardsByThemeEdh) : [];

  // now get the card data from scryfall
  const {
    isPending: isWaitingForCardsByTheme,
    error: cardsByThemeError,
    data: cardsByTheme,
  } = useQuery({
    queryKey: [`commanderTheme:${theme}`, commanderNames],
    queryFn: () => new ScryfallApi().getCollection(commanderNames!),
    enabled: !!commanderNames?.length,
  });

  const originalEdhCardPairings = cardsByThemeEdh?.map((card) => card.name);
  const formattedData = cardsByTheme && originalEdhCardPairings ? formatCardData(cardsByTheme, originalEdhCardPairings) : [];

  return {
    isWaitingForCardsByTheme,
    cardsByThemeError: cardsByThemeErrorEdh || cardsByThemeError,
    cardsByTheme: formattedData,
  };
}
