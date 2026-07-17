import Loader from "../ui/Loader";
import CardFaceView from "./CardFaceView";
import Rulings from "./Ruling";
import ErrorMessage from "../ui/ErrorMessage";
import { useCardQuery } from "@/hooks/useScryfallQuery";

interface Props {
  cardName: string;
}

export default function FullCardInfo({ cardName }: Readonly<Props>) {
  const { data: card, isPending, error } = useCardQuery(cardName);

  if (isPending) return <Loader />;
  if (error || !card) return <ErrorMessage msg={error ? error.message : "Failed to fetch card data"} />;

  return (
    <div className="my-10">
      <CardFaceView card={card} />

      <div className="flex gap-3">
        <p>EUR: {card.prices.eur}</p>
        <p>USD: {card.prices.usd}</p>
      </div>

      <div className="mt-4 text-right">
        <Rulings rulingUri={card.rulings_uri} />
      </div>
    </div>
  );
}
