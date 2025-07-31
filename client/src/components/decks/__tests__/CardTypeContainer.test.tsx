import { render, screen, fireEvent } from '@testing-library/react';
import CardTypeContainer from '../CardTypeContainer';
import { type DeckCardDetails } from '@/api/backendDeckApi';

vi.mock('../CompactCardInfo', () => ({
  default: ({ cardDetails, quantity }: any) => (
    <div data-testid="compact-card-info">{cardDetails.card.cardName} - {quantity}</div>
  ),
}));

describe('CardTypeContainer', () => {
  const mockHoverFunc = vi.fn();

  const mockCards: DeckCardDetails[] = [
    {
      id: '1',
      card: {
        id: 'card1',
        cardName: 'Card One',
        manaSymbolUris: [],
        cardImageUrl: ['image1.jpg'],
        tcgplayer_id: 1,
      },
      quantity: 2,
      commander: false,
    },
    {
      id: '2',
      card: {
        id: 'card2',
        cardName: 'Card Two',
        manaSymbolUris: [],
        cardImageUrl: ['image2.jpg'],
        tcgplayer_id: 2,
      },
      quantity: 1,
      commander: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the heading', () => {
    render(<CardTypeContainer heading="Creatures" cards={[]} hoverFunc={mockHoverFunc} />);
    expect(screen.getByText('Creatures')).toBeInTheDocument();
  });

  it('should render CompactCardInfo for each card', () => {
    render(<CardTypeContainer heading="Spells" cards={mockCards} hoverFunc={mockHoverFunc} />);
    expect(screen.getByText('Card One - 2')).toBeInTheDocument();
    expect(screen.getByText('Card Two - 1')).toBeInTheDocument();
    expect(screen.getAllByTestId('compact-card-info')).toHaveLength(2);
  });

  it('should call hoverFunc on mouse enter', () => {
    render(<CardTypeContainer heading="Lands" cards={mockCards} hoverFunc={mockHoverFunc} />);
    fireEvent.mouseEnter(screen.getByText('Card One - 2'));
    expect(mockHoverFunc).toHaveBeenCalledWith('image1.jpg');

    fireEvent.mouseEnter(screen.getByText('Card Two - 1'));
    expect(mockHoverFunc).toHaveBeenCalledWith('image2.jpg');
  });
});
