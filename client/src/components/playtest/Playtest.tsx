import { useReducer } from "react";


import { useGetDeckById } from "../decks/useDeckQuery";
import { initialState, playTestReducer } from "./playTestReducer";
import Loader from "../ui/Loader";

function shuffleDeck(arr: string[]) {
  for (let i = 0; i < arr.length; i++) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    const temp = arr[i];
    arr[i] = arr[randomIndex];
    arr[randomIndex] = temp;
  }
}

export default function PlayTest() {
  const { deckById, deckByIdError, isWaitingForDeck } = useGetDeckById();
  const [{ hand, mulligan, drawnCard }, dispatch] = useReducer(playTestReducer, initialState);

  if (isWaitingForDeck) return <Loader/>;
  if (deckByIdError) throw new Error("Error loading deck");
  const newDeck: string[] = [];
  deckById?.forEach((card) => {
    newDeck.push(...Array(card.quantity).fill(card.card.cardImageUrl))
  })

  function drawHand() {
    shuffleDeck(newDeck);
    const deckSize = newDeck.length < 7 ? newDeck?.length : 7;
    const tempHand = [];
    for (let i = 0; i < deckSize; i++) {
      tempHand.push(newDeck[i]);
    }
    dispatch({ type: "drawHand", payload: tempHand });
  }

  function drawCard() {
    dispatch({ type: "drawCard", payload: deckById![hand.length].card.cardImageUrl[0] });
  }

  function takeMulligan() {
    shuffleDeck(newDeck);
    const deckSize = newDeck.length < 7 ? newDeck?.length : 7;
    const tempHand = [];
    for (let i = 0; i < deckSize - mulligan; i++) {
      tempHand.push(newDeck[i]);
    }
    dispatch({ type: "mulligan", payload: tempHand });
  }

  return (
    <div className="mt-4 text-center">
      <div className="flex justify-center gap-2">
        <button className="rounded-lg bg-slate-950 px-3 py-2 text-stone-100" onClick={drawHand}>
          Draw Hand
        </button>
        {hand.length < deckById!.length && (
          <button className="rounded-lg bg-slate-950 px-3 py-2 text-stone-100" onClick={drawCard}>
            Draw Card
          </button>
        )}
        <button
          className="rounded-lg bg-slate-950 px-3 py-2 text-stone-100 disabled:cursor-not-allowed disabled:bg-slate-400/30"
          onClick={takeMulligan}
          disabled={hand.length === 0 || drawnCard}
        >
          Take Mulligan
        </button>
      </div>
      <div className="my-3 flex flex-wrap justify-center gap-2">
        {hand.map((img: string) => (
          <img key={img} src={img} alt="card" className="h-64"></img>
        ))}
      </div>
    </div>
  );
}