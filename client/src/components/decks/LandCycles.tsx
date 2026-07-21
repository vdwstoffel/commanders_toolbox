import { useState } from "react";

import MagicCardImage from "../cards/MagicCardImage";
import Loader from "../ui/Loader";

import { landCycles } from "@/utils/landCycles";
import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";
import { useGetDeckById } from "./useDeckQuery";
import { getDeckColorIdentity } from "../../utils/helperFunctions";
import OverlayWrapper from "../ui/OverlayWrapper";
import AddCardDialog from "./AddCardDialog";

const scryfallApi = new ScryfallApi();

const slugify = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function LandCycles() {
  const { isWaitingForDeck, deckByIdError, deckById } = useGetDeckById();
  const [selectedCardScryfallDetails, setSelectedCardScryfallDetails] = useState<MagicCard | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  if (isWaitingForDeck) return <Loader />;
  if (deckByIdError) throw new Error("Could not load deck");

  const cardsInDeck = deckById?.map((card) => card.card.cardName);
  // Get the color identities of all commanders, make a set of color identities, and join it as a string
  const colorIdentity = getDeckColorIdentity(deckById!);
  const commanderNames = deckById?.[0]?.deck?.commander ?? [];

  // Only keep cycles that still have lands this deck can add — drives both the sidebar and the body
  const visibleCycles = landCycles
    .map((cycle) => ({
      label: cycle.label,
      slug: slugify(cycle.label),
      lands: cycle.lands.filter((land) => {
        if (cardsInDeck?.includes(land.cardName)) return false;
        return land.colors.every((c) => colorIdentity?.includes(c));
      }),
    }))
    .filter((cycle) => cycle.lands.length > 0);

  async function selectCardHandler(cardName: string) {
    const cardDetails = await scryfallApi.getCardByName(cardName);
    setSelectedCardScryfallDetails(cardDetails);
    setShowOverlay(true);
  }

  function closeOveralyHandler() {
    setShowOverlay(false);
  }

  return (
    <div className="relative grid grid-cols-[1fr_6fr]">
      <div>
        <div className="sticky top-30 mx-auto ml-5 mt-10 flex-col rounded-lg bg-card p-3 text-card-foreground hidden md:flex">
          {visibleCycles.map((cycle) => (
            <a key={cycle.slug} href={`#${cycle.slug}`} className="flex justify-between gap-3 hover:text-accent-foreground">
              <span>{cycle.label}</span>
              <span className="text-muted-foreground">{cycle.lands.length}</span>
            </a>
          ))}
        </div>
      </div>
      <div className="mx-4">
        {visibleCycles.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">No new lands to suggest for this deck.</p>
        ) : (
          visibleCycles.map((cycle) => (
            <div className="my-10" key={cycle.slug}>
              <h1 className="mb-5 rounded-lg bg-card text-center text-xl font-bold text-card-foreground" id={cycle.slug}>
                {cycle.label}
              </h1>
              <ul className="flex flex-wrap content-center justify-center gap-2">
                {cycle.lands.map((land) => (
                  <li
                    key={land.cardName}
                    role="button"
                    tabIndex={0}
                    aria-label={`Add ${land.cardName}`}
                    className="cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={() => selectCardHandler(land.cardName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectCardHandler(land.cardName);
                      }
                    }}
                  >
                    <MagicCardImage imageUrl={land.cardImage} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      {showOverlay && selectedCardScryfallDetails && (
        <OverlayWrapper hideFn={closeOveralyHandler}>
          <AddCardDialog
            card={selectedCardScryfallDetails}
            deckColorIdentity={colorIdentity}
            commanderNames={commanderNames}
            deckCards={deckById ?? []}
            onClose={closeOveralyHandler}
          />
        </OverlayWrapper>
      )}
    </div>
  );
}
