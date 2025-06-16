

import Loader from "../ui/Loader";
import { useEdhRecCommanderStats, useGetDeckById } from "./useDeckQuery";

export default function TypeAverageVsTotal() {
  const { deckById, isWaitingForDeck } = useGetDeckById();

  const { typeAverages, isPending: isWaitingForDeckState } = useEdhRecCommanderStats(deckById![0].deck.commander, deckById![0].deck.theme);

  if (isWaitingForDeck || isWaitingForDeckState) return <Loader />
  if (!deckById) return;

  let creatures = 0;
  let planeswalkers = 0;
  let artifacts = 0;
  let enchantments = 0;
  let instants = 0;
  let sorceries = 0;
  let battles = 0;
  let lands = 0;
  let total = 0

  for (let i = 0; i < deckById?.length; i++) {
    if (deckById[i].card.cardType === "creature" && !deckById[i].commander) creatures += deckById[i].quantity;
    if (deckById[i].card.cardType === "planeswalker" && !deckById[i].commander) planeswalkers += deckById[i].quantity;
    if (deckById[i].card.cardType === "artifact" && !deckById[i].commander) artifacts += deckById[i].quantity;
    if (deckById[i].card.cardType === "enchantment" && !deckById[i].commander) enchantments += deckById[i].quantity;
    if (deckById[i].card.cardType === "instant" && !deckById[i].commander) instants += deckById[i].quantity;
    if (deckById[i].card.cardType === "sorcery" && !deckById[i].commander) sorceries += deckById[i].quantity;
    if (deckById[i].card.cardType === "battle" && !deckById[i].commander) battles += deckById[i].quantity;
    if (deckById[i].card.cardType === "land" && !deckById[i].commander) lands += deckById[i].quantity;

    total += deckById[i].quantity
  }

  return (
    <div className="mx-auto my-6 w-fit rounded-lg bg-slate-100/30 px-3 py-2">
      <table className="table-auto border-separate border-spacing-x-2">
        <thead>
          <tr>
            <th></th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/8/81/Creature_symbol.svg"
                alt="creature-symbol"
              />
            </th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/8/82/Instant_symbol.svg"
                alt="instant-symbol"
              />
            </th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/4/4f/Sorcery_symbol.svg"
                alt="sorcery-symbol"
              />
            </th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/7/7a/Battle_symbol.svg"
                alt="battle-symbol"
              />
            </th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/c/c7/Artifact_symbol.svg"
                alt="artifact-symbol"
              />
            </th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/0/01/Enchantment_symbol.svg"
                alt="enchantment-symbol"
              />
            </th>
            <th>
              <img className="h-4 w-4" src="https://svgs.scryfall.io/card-symbols/PW.svg" alt="planeswalker-symbol" />
            </th>
            <th>
              <img
                className="h-4 w-4"
                src="https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/3/37/Land_symbol.svg"
                alt="land-symbol"
              />
            </th>
            <th>
              <p className="text-sm text-black">Total</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><p className="text-black">Average</p></td>
            <td>{typeAverages?.creatures}</td>
            <td>{typeAverages?.instants}</td>
            <td>{typeAverages?.sorceries}</td>
            <td>{typeAverages?.battles}</td>
            <td>{typeAverages?.artifacts}</td>
            <td>{typeAverages?.enchantments}</td>
            <td>{typeAverages?.planeswalkers}</td>
            <td>{typeAverages?.lands}</td>
          </tr>
          <tr>
            <td><p className="text-black">Current</p></td>
            <td>{creatures}</td>
            <td>{instants}</td>
            <td>{sorceries}</td>
            <td>{battles}</td>
            <td>{artifacts}</td>
            <td>{enchantments}</td>
            <td>{planeswalkers}</td>
            <td>{lands}</td>
            <td>{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}