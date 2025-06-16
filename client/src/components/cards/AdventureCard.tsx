import { type MagicCard } from "@/api/scryfallApi";
import CardInfoContainer from "./CardInfoContainer";

interface Props {
  card: MagicCard;
}

export default function AdventureCard({ card }: Readonly<Props>) {
  if (!card.card_faces) return;

  return (
    <div className="flex flex-col gap-4">
      <CardInfoContainer
        card_image={card.image_uris?.large}
        name={card.card_faces[0].name}
        type_line={card.card_faces[0].type_line}
        oracle_text={card.card_faces[0].oracle_text}
        flavor_text={card.card_faces[0].flavor_text as string}
      />
      <CardInfoContainer
        name={card.card_faces[1].name}
        type_line={card.card_faces[1].type_line}
        oracle_text={card.card_faces[1].oracle_text}
        flavor_text={card.card_faces[1].flavor_text as string}
      />
    </div>
  );
}
