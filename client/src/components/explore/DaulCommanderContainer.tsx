interface Props {
  cardImageOneImageUrl: string;
  cardImageTwoImageUrl: string;
}

export default function DualCommanderContainer({ cardImageOneImageUrl, cardImageTwoImageUrl }: Props) {
  return (
    <div className="relative w-60 h-85">
        <img src={cardImageOneImageUrl} alt="Magic Card" className="w-55 absolute z-20 top-7 " />
        <img src={cardImageTwoImageUrl} alt="Magic Card" className="w-55 absolute z-10 left-5 hover:z-30" />
    </div>
  );
}
