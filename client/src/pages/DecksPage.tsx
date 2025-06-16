import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user/useUser";
import { useGetDecks } from "@/components/decks/useDeckQuery";
import Loader from "@/components/ui/Loader";
import DeckBox from "@/components/decks/DeckBox";

export default function DecksPage() {
  const navigate = useNavigate();
  const { idToken } = useUser();
  const { deckData, getDecksError, waitingForDecks } = useGetDecks(idToken);

  if (waitingForDecks) return <Loader />;
  if (getDecksError) return <h1>Should mnake a error for decks error</h1>;

  return (
    <div className="text-center mt-10">
      <Button onClick={() => navigate("/decks/new-deck")}>Create new deck</Button>
      <div className="mt-10 grid place-items-center gap-6 sm:grid-cols-2 md:grid-cols-4 px-3 py-2">
        {deckData && deckData.map((deck) => {
          return <DeckBox key={deck.deckId} deckId={deck.deckId} deckName={deck.deckName} deckImage={deck.deckImageUri} />;
        })}
      </div>
    </div>
  );
}
