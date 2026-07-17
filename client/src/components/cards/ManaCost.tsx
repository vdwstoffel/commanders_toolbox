interface Props {
  mana_cost?: string;
}

export function parseManaSymbols(manaCost?: string): string[] {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g) ?? [];
  return matches.map((token) => token.slice(1, -1));
}

function symbolUrl(code: string): string {
  return `https://svgs.scryfall.io/card-symbols/${code.replace("/", "")}.svg`;
}

export default function ManaCost({ mana_cost }: Props) {
  const symbols = parseManaSymbols(mana_cost);
  if (symbols.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {symbols.map((code, idx) => (
        <img
          key={`${code}-${idx}`}
          src={symbolUrl(code)}
          alt={code}
          title={code}
          className="w-4 h-4"
          data-testid="mana-symbol"
        />
      ))}
    </div>
  );
}
