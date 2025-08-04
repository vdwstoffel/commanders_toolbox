import { render, screen } from '@testing-library/react';
import MagicCardImage from '../MagicCardImage';

describe('MagicCardImage', () => {
  it('should render the image with the correct src and alt attributes', () => {
    const imageUrl = 'test-image.jpg';
    render(<MagicCardImage imageUrl={imageUrl} />);
    const image = screen.getByAltText('Magic Card');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', imageUrl);
  });

  it('should render "Image not available" when imageUrl is not provided', () => {
    render(<MagicCardImage imageUrl={undefined} />);
    expect(screen.getByText('Image not available')).toBeInTheDocument();
  });

  it('should call clickFunction when the image is clicked', () => {
    const handleClick = vi.fn();
    const imageUrl = 'test-image.jpg';
    render(<MagicCardImage imageUrl={imageUrl} clickFunction={handleClick} />);
    const image = screen.getByAltText('Magic Card');
    image.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});