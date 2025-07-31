import { render, screen, fireEvent } from '@testing-library/react';
import MagicCardImage from '../MagicCardImage';

describe('MagicCardImage', () => {
  it('should render the image when imageUrl is provided', () => {
    const imageUrl = 'http://example.com/card.jpg';
    render(<MagicCardImage imageUrl={imageUrl} />);
    const image = screen.getByAltText('Magic Card');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', imageUrl);
  });

  it('should render "Image not available" when imageUrl is undefined', () => {
    render(<MagicCardImage imageUrl={undefined} />);
    expect(screen.getByText('Image not available')).toBeInTheDocument();
  });

  it('should call clickFunction when the image is clicked', () => {
    const imageUrl = 'http://example.com/card.jpg';
    const mockClickFunction = vi.fn();
    render(<MagicCardImage imageUrl={imageUrl} clickFunction={mockClickFunction} />);
    const image = screen.getByAltText('Magic Card');
    fireEvent.click(image);
    expect(mockClickFunction).toHaveBeenCalledTimes(1);
  });
});
