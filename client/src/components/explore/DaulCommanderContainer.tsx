interface Props {
  cardImageOneImageUrl: string;
  cardImageTwoImageUrl: string;
}

export default function DualCommanderContainer({ cardImageOneImageUrl, cardImageTwoImageUrl }: Props) {
  return (
    <div className="relative w-60">
      <img src={cardImageOneImageUrl} className=" w-55 absolute z-20 top-7" />
      <img src={cardImageTwoImageUrl} className="w-55 absolute z-10 left-7 hover:z-30" />
    </div>
  );
}
