import { render, screen } from '@testing-library/react';
import CardInfoContainer from '../CardInfoContainer';

describe('CardInfoContainer', () => {
  const commonProps = {
    name: 'Test Card',
    type_line: 'Creature - Human',
    oracle_text: 'This is the oracle text.',
  };

  it('should render with all props including image and flavor text', () => {
    const props = {
      ...commonProps,
      card_image: 'http://example.com/image.jpg',
      flavor_text: 'This is the flavor text.',
    };
    render(<CardInfoContainer {...props} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Creature - Human')).toBeInTheDocument();
    expect(screen.getByText('This is the oracle text.')).toBeInTheDocument();
    expect(screen.getByText('This is the flavor text.')).toBeInTheDocument();
    expect(screen.getByAltText('Test Card-img')).toHaveAttribute('src', 'http://example.com/image.jpg');
  });

  it('should render without image when card_image is undefined', () => {
    const props = {
      ...commonProps,
      card_image: undefined,
      flavor_text: 'This is the flavor text.',
    };
    render(<CardInfoContainer {...props} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.queryByAltText('Test Card-img')).not.toBeInTheDocument();
    expect(screen.getByText('This is the flavor text.')).toBeInTheDocument();
    expect(screen.getByText('This is the oracle text.')).toBeInTheDocument();
  });

  it('should render without flavor text when flavor_text is empty', () => {
    const props = {
      ...commonProps,
      card_image: 'http://example.com/image.jpg',
      flavor_text: '',
    };
    render(<CardInfoContainer {...props} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByAltText('Test Card-img')).toBeInTheDocument();
    expect(screen.queryByText('This is the flavor text.')).not.toBeInTheDocument();
  });
});
