interface Props {
  imageUrl: string | undefined;
  clickFunction?: () => void;
}

export default function MagicCardImage({ imageUrl, clickFunction }: Props) {
  
  if (!imageUrl) {
    return <div className="max-w-60">Image not available</div>
  }
  
  return (
    <div className="max-w-60">
      <img src={imageUrl} alt="Magic Card" onClick={clickFunction} data-testid="magic-card-image"/>
    </div>
  );
}
