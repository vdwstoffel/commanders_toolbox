import { type MagicCard } from "@/api/scryfallApi";


import CardInfoContainer from "./CardInfoContainer";

interface Props {
  card: MagicCard;
}

export default function DoubleFacedCard({ card }: Readonly<Props>) {
  if (!card.card_faces) return;

  return (
    <div className="flex flex-col gap-4">
      <CardInfoContainer
        card_image={card.card_faces[0].image_uris.large}
        name={card.card_faces[0].name}
        flavor_text={card.card_faces[0].flavor_text as string}
        oracle_text={card.card_faces[0].oracle_text}
        type_line={card.card_faces[0].type_line}
      />
      <CardInfoContainer
        card_image={card.card_faces[1].image_uris.large}
        name={card.card_faces[1].name}
        flavor_text={card.card_faces[1].flavor_text as string}
        oracle_text={card.card_faces[1].oracle_text}
        type_line={card.card_faces[1].type_line}
      />
    </div>
  );
}
