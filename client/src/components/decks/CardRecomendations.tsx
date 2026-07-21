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
  const { addCardAsync } = useAddCardToDeck();
  const [selectedCard, setSelectedCard] = useState<MagicCard | undefined>(undefined);
  const [showCardInfoOverlay, setShowCardInfoOverlay] = useState<boolean>(false);
  const [addingCardName, setAddingCardName] = useState<string>("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  if (isPending) return <Loader />;
  if (error) {
    return <h1 className="mt-10 text-center text-xl">Could not load Card Recommendations</h1>;
  }

  const cardsInDeck = deckById?.map((card) => card.card.cardName.split("//")[0].trim()); // only check the first name of double sided cards
  const isInDeck = (name: string) => cardsInDeck?.includes(name) ?? false;

  // label each category with how many recommendations aren't in the deck yet
  const tabs = recs?.map((rec) => {
    const newCount = rec.cardviews.filter((card) => !isInDeck(card.name)).length;
    return `${rec.header} (${newCount})`;
  });

  // sort by synergy, but hide cards already in the deck — this tab is for finding new cards
  const sortedCards = [...recs![activeTabIndex].cardviews]
    .filter((card) => !isInDeck(card.name))
    .sort((a, b) => b.synergy - a.synergy);

  function activeTabHandler(index: number) {
    setActiveTabIndex(index);
  }

  function markImageFailed(name: string) {
    setFailedImages((prev) => new Set(prev).add(name));
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
      await addCardAsync({ card: res, quantity: 1 });
    } catch {
      /* lookup/add failures are surfaced via toast by the mutation */
    } finally {
      setAddingCardName("");
    }
  }

  function onOverlayClose() {
    setShowCardInfoOverlay(false);
  }

  return (
    <div className="mt-10 flex w-full gap-4 px-4">
      <Tabs tabs={tabs} direction="col" tabHandler={activeTabHandler} activeTab={activeTabIndex} />
      <div className="max-h-[70vh] flex-1 overflow-auto pr-2 [scrollbar-color:#404040_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
        {sortedCards.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-400">
            No new recommendations here — the rest are already in your deck.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {sortedCards.map((card) => {
              const synergyPct = Math.round(card.synergy * 100);
              const showImage = card.id && !failedImages.has(card.name);
              const isAdding = addingCardName === card.name;
              return (
                <div
                  key={card.name}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${card.name}`}
                  className="group relative cursor-pointer overflow-hidden rounded-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  onClick={() => onClickHandler(card.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onClickHandler(card.name);
                    }
                  }}
                >
                  {showImage ? (
                    <img
                      src={scryfallImageFromId(card.id!)}
                      alt={card.name}
                      loading="lazy"
                      className="aspect-[63/88] w-full rounded-lg object-cover"
                      onError={() => markImageFailed(card.name)}
                    />
                  ) : (
                    <div className="flex aspect-[63/88] w-full items-center justify-center rounded-lg bg-neutral-800 p-2 text-center text-sm">
                      {card.name}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-black/70 px-2 py-1 text-xs">
                    <span className="truncate">{card.name}</span>
                    <div className="flex shrink-0 flex-col items-end leading-tight">
                      <span title="Share of this commander's decks that run this card" className="font-semibold">
                        {inclusionPercent(card)}%
                      </span>
                      <span
                        title="Synergy — how much more often this card appears with this commander than in the format overall"
                        className={synergyPct >= 0 ? "text-emerald-400" : "text-red-400"}
                      >
                        {synergyPct >= 0 ? "+" : ""}
                        {synergyPct}%
                      </span>
                    </div>
                  </div>

                  <button
                    aria-label={`Add ${card.name}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-black disabled:opacity-50 [@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover:flex"
                    disabled={isAdding}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(card.name);
                    }}
                  >
                    {isAdding ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    ) : (
                      "+"
                    )}
                  </button>
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
