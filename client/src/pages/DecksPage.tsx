import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user/useUser";
import { useGetDecks } from "@/components/decks/useDeckQuery";
import Loader from "@/components/ui/Loader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import DeckBox from "@/components/decks/DeckBox";

export default function DecksPage() {
  const navigate = useNavigate();
  const { idToken } = useUser();
  const { deckData, getDecksError, waitingForDecks } = useGetDecks(idToken);

  if (waitingForDecks) return <Loader />;
  if (getDecksError) return <ErrorMessage msg="Could not load your decks. Please try again." />;

  if (!deckData || deckData.length === 0) {
    return (
      <div className="mx-auto mt-20 flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-3xl text-foreground">No decks yet</h1>
        <p className="text-muted-foreground">Start building your first Commander deck.</p>
        <Button onClick={() => navigate("/decks/new-deck")}>Create a Deck</Button>
      </div>
    );
  }

  return (
    <div className="text-center mt-10">
      <Button onClick={() => navigate("/decks/new-deck")}>Create a Deck</Button>
      <div className="mt-10 grid place-items-center gap-6 sm:grid-cols-2 md:grid-cols-4 px-3 py-2">
        {deckData.map((deck) => {
          return <DeckBox key={deck.deckId} deckId={deck.deckId} deckName={deck.deckName} deckImage={deck.deckImageUri} />;
        })}
      </div>
    </div>
  );
}
