import { useEffect, useState } from "react";

import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";

import CardInfoContainer from "./CardInfoContainer";

interface Props {
  card: MagicCard;
}

const scryfallApi = new ScryfallApi();

export default function MeldCard({ card }: Readonly<Props>) {
  const [meldedCard, setMeldedCard] = useState<MagicCard | null>(null);
  const backside = card?.all_parts?.filter((card) => card.component === "meld_result");

  useEffect(() => {
    if (!card || !backside) return;

    async function getMeldedCard() {
      const res = await scryfallApi.getCardByName(backside![0].name);
      setMeldedCard(res);
    }

    getMeldedCard();
  }, [card]);

  if (!card || !meldedCard) return;

  return (
    <div className="flex flex-col gap-4">
      <CardInfoContainer
        card_image={card.image_uris?.large as string}
        name={card.name}
        oracle_text={card.oracle_text}
        type_line={card.type_line}
        flavor_text={card.flavor_text as string}
      />
      <CardInfoContainer
        card_image={meldedCard?.image_uris?.large as string}
        name={meldedCard?.name}
        oracle_text={meldedCard?.oracle_text}
        type_line={meldedCard?.type_line}
        flavor_text={meldedCard?.flavor_text as string}
      />
    </div>
  );
}
