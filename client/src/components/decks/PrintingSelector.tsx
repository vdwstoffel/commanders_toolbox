import { useState } from "react";

import type { PrintingData } from "@/api/scryfallApi";

interface Props {
  printings: PrintingData[];
  selectedTcgId: number | undefined;
  onSelect: (tcgId: number) => void;
}

// Horizontal artwork picker with a set-name filter — some cards have dozens of reprints.
export default function PrintingSelector({ printings, selectedTcgId, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q ? printings.filter((p) => p.setName.toLowerCase().includes(q)) : printings;

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Printing — choose artwork <span className="font-normal">({filtered.length})</span>
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by set…"
          aria-label="Filter printings by set"
          className="w-44 rounded-md border border-border bg-muted px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No printings match “{query}”.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtered.map((p) => {
            const selected = p.tcgplayer_id === selectedTcgId;
            return (
              <button
                key={p.tcgplayer_id}
                type="button"
                onClick={() => onSelect(p.tcgplayer_id)}
                aria-label={`Select printing: ${p.setName}`}
                aria-pressed={selected}
                className="w-[70px] flex-shrink-0 cursor-pointer text-left"
              >
                <img
                  src={p.imageUrl}
                  alt={`${p.setName} printing`}
                  data-testid="printing-thumb"
                  className={`h-[98px] w-full rounded-md border-2 ${selected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                />
                <span className={`mt-1 block truncate text-center text-[10px] ${selected ? "text-primary" : "text-muted-foreground"}`}>
                  {p.setName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
