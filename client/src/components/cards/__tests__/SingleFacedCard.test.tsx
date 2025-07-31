import { render, screen } from '@testing-library/react';
import SingleFacedCard from '../SingleFacedCard';
import { type MagicCard } from '@/api/scryfallApi';

vi.mock('../CardInfoContainer', () => ({
  default: ({ name, type_line, oracle_text, flavor_text, card_image }: any) => (
    <div data-testid="card-info-container">
      <p>{name}</p>
      <p>{type_line}</p>
      <p>{oracle_text}</p>
      <p>{flavor_text}</p>
      <img src={card_image} alt="card image" />
    </div>
  ),
}));

describe('SingleFacedCard', () => {
  it('should render CardInfoContainer with correct props', () => {
    const mockCard: MagicCard = {
      name: 'Test Single Card',
      image_uris: { large: 'single_card.jpg' },
      oracle_text: 'Single card oracle text',
      type_line: 'Creature - Human',
      flavor_text: 'Single card flavor text',
    } as MagicCard;

    render(<SingleFacedCard card={mockCard} />);

    const cardInfoContainer = screen.getByTestId('card-info-container');
    expect(cardInfoContainer).toBeInTheDocument();
    expect(screen.getByText('Test Single Card')).toBeInTheDocument();
    expect(screen.getByText('Creature - Human')).toBeInTheDocument();
    expect(screen.getByText('Single card oracle text')).toBeInTheDocument();
    expect(screen.getByText('Single card flavor text')).toBeInTheDocument();
    expect(screen.getByAltText('card image')).toHaveAttribute('src', 'single_card.jpg');
  });
});
