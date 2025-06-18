import { useState } from "react";

import CardInfoOverlay from "./CardInfoOverlay";
import Tabs from "../ui/CustomTabs";

import { useEdhRecCommanderStats, useGetDeckById } from "./useDeckQuery";
import { ScryfallApi, type MagicCard } from "../../api/scryfallApi";
import Loader from "../ui/Loader";

interface Props {
  commander: string[];
  theme: string;
}

const scryfallApi = new ScryfallApi();

export default function CardRecommendations({ commander, theme }: Props) {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const { isPending, error, recs } = useEdhRecCommanderStats(commander, theme);
  const { deckById } = useGetDeckById();
  const [hoveredCardImageUrl, setHoveredCardImageUrl] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<MagicCard | undefined>(undefined);
  const [showCardInfoOverlay, setShowCardInfoOverlay] = useState<boolean>(false);

  if (isPending) return <Loader />;
  if (error) {
    return <h1 className="mt-10 text-center text-xl">Could not load Card Recommendations</h1>;
  }
  const tabs = recs?.map((rec) => rec.header);
  const recommendedCards = recs![activeTabIndex].cardviews;
  const cardsInDeck = deckById?.map((card) => card.card.cardName.split("//")[0].trim()); // only check the first name of double sided cards
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  function activeTabHandler(index: number) {
    setActiveTabIndex(index);
  }

  async function onHoverHandler(cardName: string) {
    // Clear any existing timeout if the hover changes quickly
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Create a new timeout to fetch the card after a short delay
    hoverTimeout = setTimeout(async () => {
      const res = await scryfallApi.getCardByName(cardName);
      setSelectedCard(res);

      if (res.image_uris) {
        setHoveredCardImageUrl(res.image_uris.large);
      } else if (res.card_faces) {
        setHoveredCardImageUrl(res.card_faces[0].image_uris.large);
      }
    }, 200);
  }

  function onHoverExitHandler() {
    setHoveredCardImageUrl("");
  }

  async function onClickHandler() {
    setShowCardInfoOverlay(!showCardInfoOverlay);
  }

  return (
    <div className="3xl:w-1/3 mx-auto mt-10 grid w-2/3 grid-cols-3">
      <Tabs tabs={tabs} direction="col" tabHandler={activeTabHandler} activeTab={activeTabIndex} />
      <div className="mx-3 mt-3 h-96 w-fit overflow-auto px-3">
        {recommendedCards
          .sort((a: { synergy: number }, b: { synergy: number }) => b.synergy - a.synergy)
          .map((card) => {
            if (!cardsInDeck?.includes(card.name)) {
              return (
                <div
                  className="grid grid-cols-[6fr_1fr] gap-3 hover:cursor-pointer"
                  onMouseEnter={() => onHoverHandler(card.name)}
                  onMouseOut={onHoverExitHandler}
                  onClick={onClickHandler}
                >
                  <p>{card.name}</p>
                  <p>{Math.round(card.synergy * 100)}%</p>
                </div>
              );
            }
          })}
      </div>
      {hoveredCardImageUrl && <img src={hoveredCardImageUrl} className="ml-12 h-96 min-w-72 rounded-lg" />}
      {showCardInfoOverlay && <CardInfoOverlay cardData={selectedCard!} closeFn={onClickHandler} />}
    </div>
  );
}
