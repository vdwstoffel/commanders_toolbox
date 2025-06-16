import { type MagicCard } from "@/api/scryfallApi";


import CardInfoContainer from "./CardInfoContainer";

interface Props {
  card: MagicCard;
}

export default function SingleFacedCard({ card }: Readonly<Props>) {
  return (
    <CardInfoContainer
      card_image={card.image_uris?.large as string}
      name={card.name}
      oracle_text={card.oracle_text}
      type_line={card.type_line}
      flavor_text={card.flavor_text as string}
    />
  );
}
