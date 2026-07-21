import Loader from "../ui/Loader";
import { useEdhRecCommanderStats, useGetDeckById } from "./useDeckQuery";

const WIKI = "https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images";

// Column order + icon per card type. `key` matches both the EDHREC averages and the current counts below.
const TYPE_COLUMNS = [
  { key: "creatures", label: "Creatures", icon: `${WIKI}/8/81/Creature_symbol.svg` },
  { key: "instants", label: "Instants", icon: `${WIKI}/8/82/Instant_symbol.svg` },
  { key: "sorceries", label: "Sorceries", icon: `${WIKI}/4/4f/Sorcery_symbol.svg` },
  { key: "battles", label: "Battles", icon: `${WIKI}/7/7a/Battle_symbol.svg` },
  { key: "artifacts", label: "Artifacts", icon: `${WIKI}/c/c7/Artifact_symbol.svg` },
  { key: "enchantments", label: "Enchantments", icon: `${WIKI}/0/01/Enchantment_symbol.svg` },
  { key: "planeswalkers", label: "Planeswalkers", icon: "https://svgs.scryfall.io/card-symbols/PW.svg" },
  { key: "lands", label: "Lands", icon: `${WIKI}/3/37/Land_symbol.svg` },
] as const;

export default function TypeAverageVsTotal() {
  const { deckById, isWaitingForDeck } = useGetDeckById();

  const { typeAverages, isPending: isWaitingForDeckState } = useEdhRecCommanderStats(
    deckById![0].deck.commander,
    deckById![0].deck.theme
  );

  if (isWaitingForDeck || isWaitingForDeckState) return <Loader />;
  if (!deckById) return;

  const current: Record<string, number> = {
    creatures: 0,
    planeswalkers: 0,
    artifacts: 0,
    enchantments: 0,
    instants: 0,
    sorceries: 0,
    battles: 0,
    lands: 0,
  };
  let total = 0;

  const typeByCardType: Record<string, string> = {
    creature: "creatures",
    planeswalker: "planeswalkers",
    artifact: "artifacts",
    enchantment: "enchantments",
    instant: "instants",
    sorcery: "sorceries",
    battle: "battles",
    land: "lands",
  };

  for (const entry of deckById) {
    total += entry.quantity;
    if (entry.commander) continue;
    const bucket = typeByCardType[entry.card.cardType];
    if (bucket) current[bucket] += entry.quantity;
  }

  const averages = typeAverages as Record<string, number | undefined>;
  const avgTotal = TYPE_COLUMNS.reduce((sum, col) => sum + (averages?.[col.key] ?? 0), 0);

  return (
    <div className="mx-auto my-6 w-fit max-w-full overflow-x-auto rounded-lg bg-muted px-3 py-2 text-foreground">
      <table className="table-auto border-separate border-spacing-x-2 text-sm">
        <thead>
          <tr>
            <th></th>
            {TYPE_COLUMNS.map((col) => (
              <th key={col.key} className="font-normal">
                <img className="mx-auto h-4 w-4" src={col.icon} alt={col.label} title={col.label} />
              </th>
            ))}
            <th className="font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-muted-foreground">
            <td className="pr-2 text-left font-medium">Average</td>
            {TYPE_COLUMNS.map((col) => (
              <td key={col.key} className="text-center">
                {averages?.[col.key] ?? 0}
              </td>
            ))}
            <td className="text-center">{avgTotal}</td>
          </tr>
          <tr>
            <td className="pr-2 text-left font-medium">Current</td>
            {TYPE_COLUMNS.map((col) => (
              <td key={col.key} className="text-center font-semibold" title={`${col.label}: ${current[col.key]}`}>
                {current[col.key]}
              </td>
            ))}
            <td className="text-center font-semibold">{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
