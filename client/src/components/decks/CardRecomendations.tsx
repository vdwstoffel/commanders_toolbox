import { useState } from "react";

import Tabs from "../ui/CustomTabs";

import { useEdhRecCommanderStats, useGetDeckById, useAddCardToDeck } from "./useDeckQuery";
import { ScryfallApi, scryfallImageFromId, type MagicCard } from "../../api/scryfallApi";
import { inclusionPercent } from "../../api/edhRecApi";
import Loader from "../ui/Loader";
import OverlayWrapper from "../ui/OverlayWrapper";
import AddCardDialog from "./AddCardDialog";

interface Props {
  commander: string[];
  theme: string;
}

const scryfallApi = new ScryfallApi();

export default function CardRecommendations({ commander, theme }: Props) {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const { isPending, error, recs } = useEdhRecCommanderStats(commander, theme);
  const { deckById } = useGetDeckById();
  const { addCard } = useAddCardToDeck();
  const [selectedCard, setSelectedCard] = useState<MagicCard | undefined>(undefined);
  const [showCardInfoOverlay, setShowCardInfoOverlay] = useState<boolean>(false);
  const [addingCardName, setAddingCardName] = useState<string>("");

  if (isPending) return <Loader />;
  if (error) {
    return <h1 className="mt-10 text-center text-xl">Could not load Card Recommendations</h1>;
  }

  const tabs = recs?.map((rec) => rec.header);
  const recommendedCards = recs![activeTabIndex].cardviews;
  const cardsInDeck = deckById?.map((card) => card.card.cardName.split("//")[0].trim()); // only check the first name of double sided cards

  const sortedCards = [...recommendedCards].sort((a, b) => b.synergy - a.synergy);
  const allInDeck = sortedCards.length > 0 && sortedCards.every((card) => cardsInDeck?.includes(card.name));

  function activeTabHandler(index: number) {
    setActiveTabIndex(index);
  }

  async function onClickHandler(cardName: string) {
    try {
      const res = await scryfallApi.getCardByName(cardName);
      setSelectedCard(res);
      setShowCardInfoOverlay(true);
    } catch {
      /* ignore failed lookups */
    }
  }

  async function onQuickAdd(cardName: string) {
    setAddingCardName(cardName);
    try {
      const res = await scryfallApi.getCardByName(cardName);
      addCard({ card: res, quantity: 1 });
    } catch {
      /* ignore failed lookups */
    } finally {
      setAddingCardName("");
    }
  }

  function onOverlayClose() {
    setShowCardInfoOverlay(false);
  }

  return (
    <div className="mx-auto mt-10 flex max-w-[110rem] gap-6 px-4">
      <Tabs tabs={tabs} direction="col" tabHandler={activeTabHandler} activeTab={activeTabIndex} />
      <div className="max-h-[70vh] flex-1 overflow-auto pr-2 [scrollbar-color:#404040_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
        {allInDeck ? (
          <p className="mt-10 text-center text-sm text-neutral-400">All recommended cards are already in your deck.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {sortedCards.map((card) => {
              const inDeck = cardsInDeck?.includes(card.name);
              return (
                <div
                  key={card.name}
                  className={`group relative cursor-pointer overflow-hidden rounded-lg transition ${
                    inDeck ? "opacity-40" : "hover:scale-105"
                  }`}
                  onClick={() => onClickHandler(card.name)}
                >
                  {card.id ? (
                    <img
                      src={scryfallImageFromId(card.id)}
                      alt={card.name}
                      loading="lazy"
                      className="aspect-[63/88] w-full rounded-lg object-cover"
                      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                    />
                  ) : (
                    <div className="flex aspect-[63/88] w-full items-center justify-center rounded-lg bg-neutral-800 p-2 text-center text-sm">
                      {card.name}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-2 py-1 text-xs">
                    <span className="truncate">{card.name}</span>
                    <span className="ml-1 shrink-0 font-semibold">{inclusionPercent(card)}%</span>
                  </div>

                  {inDeck ? (
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">In deck</span>
                  ) : (
                    <button
                      aria-label={`Add ${card.name}`}
                      className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-black group-hover:flex disabled:opacity-50"
                      disabled={addingCardName === card.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAdd(card.name);
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCardInfoOverlay && selectedCard && (
        <OverlayWrapper hideFn={onOverlayClose}>
          <AddCardDialog
            card={selectedCard}
            deckColorIdentity={deckById?.[0]?.deck.colorIdentity ?? ""}
            commanderNames={commander}
            deckCards={deckById ?? []}
            onClose={onOverlayClose}
          />
        </OverlayWrapper>
      )}
    </div>
  );
}
