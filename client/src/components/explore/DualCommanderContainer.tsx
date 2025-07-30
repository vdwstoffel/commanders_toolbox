interface Props {
  cardImageOneImageUrl: string;
  cardImageTwoImageUrl: string;
  clickFunction: () => void;
}

export default function DualCommanderContainer({ cardImageOneImageUrl, cardImageTwoImageUrl, clickFunction }: Props) {
  return (
    <div className="relative w-60 h-85">
      <img
        src={cardImageOneImageUrl}
        alt="First commander card"
        className="w-55 absolute z-20 top-7 cursor-pointer"
        onClick={clickFunction}
        onKeyDown={(e) => e.key === "Enter" && clickFunction()}
        tabIndex={0}
        role="button"
      />
      <img
        src={cardImageTwoImageUrl}
        alt="Second commander card"
        className="w-55 absolute z-10 left-5 hover:z-30 cursor-pointer"
        onClick={clickFunction}
        onKeyDown={(e) => e.key === "Enter" && clickFunction()}
        tabIndex={0}
        role="button"
      />
    </div>
  );
}
