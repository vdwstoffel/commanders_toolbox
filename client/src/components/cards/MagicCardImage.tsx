interface Props {
  imageUrl: string | undefined;
}

export default function MagicCardImage({ imageUrl }: Props) {
  
  if (!imageUrl) {
    return <div className="max-w-60">Image not available</div>
  }
  
  return (
    <div className="max-w-60">
      <img src={imageUrl} alt="Magic Card"/>
    </div>
  );
}
