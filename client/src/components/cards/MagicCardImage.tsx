interface Props {
  imageUrl: string | undefined;
}

/**
 * Displays an image inside a container with a maximum width of 60 units.
 *
 * @param imageUrl - The URL of the image to display, or undefined if no image is provided.
 */
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
