import { type DeckCardDetails } from "@/api/backendDeckApi";

export default function getDeckColorIdentity(deck: DeckCardDetails[]) {
  return [
    ...new Set(
      deck
        ?.filter((card) => card.commander === true)
        .map((card) => card.card.colorIdentity)
        .join(""),
    ),
  ].join("");
}