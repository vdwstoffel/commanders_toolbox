import { Link } from "react-router-dom";

interface Props {
  deckName: string;
  deckImage: string[];
  deckId: number;
}

export default function DeckBox({ deckName, deckImage, deckId }: Props) {
  if (deckImage.length === 1) {
    return (
      <Link to={`/decks/${deckId}`}>
        <div className="relative shadow hover:cursor-pointer hover:shadow-2xl hover:shadow-slate-200/70 sm:w-36 md:w-24 lg:w-72">
          <img src={deckImage[0]} alt="mtgCard-img" className="rounded-xl" />
          <p className="absolute bottom-0 w-full rounded-b-xl bg-neutral-700/50 font-bold text-neutral-200">{deckName}</p>
        </div>
      </Link>
    );
  } else {
    return (
      <Link to={`/decks/${deckId}`}>
        <div className="group relative shadow hover:cursor-pointer hover:shadow-2xl hover:shadow-slate-200/70 sm:w-36 md:w-24 lg:w-72">
          <img
            src={deckImage[0]}
            alt="mtgCard-img"
            className="rounded-xl transition-opacity duration-300 ease-in-out group-hover:opacity-0"
          />
          <img
            src={deckImage[1]}
            alt="mtgCard-img"
            className="absolute left-0 top-0 rounded-xl opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
          />
          <p className="absolute bottom-0 w-full rounded-b-xl bg-neutral-700/50 font-bold text-neutral-200">{deckName} [Partner]</p>
        </div>
      </Link>
    );
  }
}