interface Props {
  imageUrl: string | undefined;
}

export default function MagicCardImage({ imageUrl }: Props) {
  return (
    <div className="w-60">
      <img src={imageUrl}></img>
    </div>
  );
}
