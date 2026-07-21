interface Props {
  imageUrl: string | undefined;
  clickFunction?: () => void;
  /** Tailwind width class for the wrapper; overrides the default so callers can size the card. */
  className?: string;
}

export default function MagicCardImage({ imageUrl, clickFunction, className = "max-w-60" }: Props) {
  if (!imageUrl) {
    return <div className={className}>Image not available</div>;
  }

  return (
    <div className={className}>
      <img src={imageUrl} alt="Magic Card" onClick={clickFunction} data-testid="magic-card-image" />
    </div>
  );
}
