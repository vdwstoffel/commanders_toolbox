import { Link } from "react-router-dom";

interface Props {
  deckName: string;
  deckImage: string[];
  deckId: number;
}

export default function DeckBox({ deckName, deckImage, deckId }: Props) {
  const hasPartner = deckImage.length > 1;

  return (
    <Link to={`/decks/${deckId}`} className="block w-full">
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow transition hover:scale-105 hover:shadow-2xl">
        <img
          src={deckImage[0]}
          alt={deckName}
          className={`h-full w-full rounded-xl object-cover ${
            hasPartner ? "transition-opacity duration-300 ease-in-out group-hover:opacity-0" : ""
          }`}
        />
        {hasPartner && (
          <img
            src={deckImage[1]}
            alt={`${deckName} partner`}
            className="absolute left-0 top-0 h-full w-full rounded-xl object-cover opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
          />
        )}
        {hasPartner && (
          <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">Partner</span>
        )}
        <p className="absolute bottom-0 w-full truncate rounded-b-xl bg-card/80 px-2 py-1 text-center font-bold text-card-foreground">
          {deckName}
        </p>
      </div>
    </Link>
  );
}
