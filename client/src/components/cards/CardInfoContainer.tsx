interface Props {
  card_image?: string;
  name: string;
  type_line: string;
  oracle_text: string;
  flavor_text: string;
}

export default function CardInfoContainer({ card_image, name, type_line, oracle_text, flavor_text }: Readonly<Props>) {
  return (
    <div className="flex gap-4 flex-col md:flex-row sm:mx-auto">
      <div>{card_image ? <img src={card_image} alt={`${name}-img`} className="h-72" /> : <div className="w-52"></div>}</div>

      <div className="[&>*]:my-3">
        <div>
          <h1 className="text-2xl">{name}</h1>
          <p className="text-xs">{type_line}</p>
        </div>
        <p className="w-72 md:w-96 text-sm">{oracle_text}</p>
        {flavor_text && <footer className="w-72 md:w-96 text-xs italic">{flavor_text}</footer>}
      </div>
    </div>
  );
}
