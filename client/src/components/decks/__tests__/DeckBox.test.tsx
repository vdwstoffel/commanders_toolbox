import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DeckBox from '../DeckBox';

describe('DeckBox', () => {
  const commonProps = {
    deckName: 'Test Deck',
    deckId: 123,
  };

  it('should render correctly with a single deck image', () => {
    const props = {
      ...commonProps,
      deckImage: ['single_image.jpg'],
    };
    render(
      <BrowserRouter>
        <DeckBox {...props} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Deck')).toBeInTheDocument();
    const img = screen.getByAltText('Test Deck');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'single_image.jpg');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/decks/123');
  });

  it('should render correctly with two deck images (partner)', () => {
    const props = {
      ...commonProps,
      deckImage: ['image1.jpg', 'image2.jpg'],
    };
    render(
      <BrowserRouter>
        <DeckBox {...props} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Deck')).toBeInTheDocument();
    expect(screen.getByText('Partner')).toBeInTheDocument();
    expect(screen.getByAltText('Test Deck')).toHaveAttribute('src', 'image1.jpg');
    expect(screen.getByAltText('Test Deck partner')).toHaveAttribute('src', 'image2.jpg');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/decks/123');
  });
});
