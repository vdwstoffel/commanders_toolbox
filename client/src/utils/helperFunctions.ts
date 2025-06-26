import { type DeckCardDetails } from "@/api/backendDeckApi";

export function getDeckColorIdentity(deck: DeckCardDetails[]) {
  return [
    ...new Set(
      deck
        ?.filter((card) => card.commander === true)
        .map((card) => card.card.colorIdentity)
        .join("")
    ),
  ].join("");
}

export function parseImportDeckList(deckList: string) {
  const splitDecklist = deckList.split("\n");

  const cards: string[] = []

  for (const card of splitDecklist) {
    const spaceIndex = card.indexOf(" ")
    const quantity = card.substring(0, spaceIndex);
    const cardName = card.substring(spaceIndex).trim()
    cards.push(cardName)
  }

  return cards;
}
