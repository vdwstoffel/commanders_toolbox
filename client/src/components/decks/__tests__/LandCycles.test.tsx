import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandCycles from '../LandCycles';
import { useGetDeckById, useAddCardToDeck } from '../useDeckQuery';
import { getDeckColorIdentity } from '@/utils/helperFunctions';
import { ScryfallApi } from '@/api/scryfallApi';

// Mock hooks and external dependencies
vi.mock('../useDeckQuery', () => ({
  useGetDeckById: vi.fn(),
  useAddCardToDeck: vi.fn(),
}));
vi.mock('@/utils/helperFunctions', () => ({
  getDeckColorIdentity: vi.fn(),
}));
vi.mock('@/api/scryfallApi');

// Mock child components
vi.mock('../../cards/MagicCardImage', () => ({
  default: ({ imageUrl }: { imageUrl: string }) => (
    <img src={imageUrl} alt="Magic Card" data-testid={`magic-card-image-${imageUrl}`} />
  ),
}));
vi.mock('../../ui/OverlayWrapper', () => ({
  default: ({ children, hideFn }: { children: React.ReactNode; hideFn: () => void }) => (
    <div data-testid="overlay-wrapper" onClick={hideFn}>
      {children}
    </div>
  ),
}));
vi.mock('../../cards/FullCardInfo', () => ({
  default: ({ cardName }: { cardName: string }) => <div data-testid="full-card-info">{cardName}</div>,
}));
vi.mock('../../ui/Loader', () => ({
    default: () => <div data-testid="loader">Loading...</div>,
}));


// Mock the landCycles data
vi.mock('@/utils/landCycles', () => ({
  landCycles: [
    {
      label: 'Cycle 1',
      lands: [
        { cardName: 'Land A', colors: ['W'], cardImage: 'image-a.jpg' },
        { cardName: 'Land B', colors: ['U'], cardImage: 'image-b.jpg' },
      ],
    },
    {
      label: 'Cycle 2',
      lands: [{ cardName: 'Land C', colors: ['B', 'R'], cardImage: 'image-c.jpg' }],
    },
  ],
}));

describe('LandCycles', () => {
  const mockAddCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addCard: mockAddCard });
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue({ name: 'Mock Card' });
    // Default mocks for successful data loading
    (useGetDeckById as jest.Mock).mockReturnValue({ isWaitingForDeck: false, deckById: [], deckByIdError: null });
    (getDeckColorIdentity as jest.Mock).mockReturnValue('WUBRG'); // Default to all colors
  });

  it('should render loader when deck is loading', () => {
    (useGetDeckById as jest.Mock).mockReturnValue({ isWaitingForDeck: true, deckById: null, deckByIdError: null });
    render(<LandCycles />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should throw error if deck fails to load', () => {
    (useGetDeckById as jest.Mock).mockReturnValue({ isWaitingForDeck: false, deckById: null, deckByIdError: true });
    expect(() => render(<LandCycles />)).toThrow('Could not load deck');
  });

  it('should render land cycles based on color identity', () => {
    (getDeckColorIdentity as jest.Mock).mockReturnValue('W');
    render(<LandCycles />);

    expect(screen.getAllByText('Cycle 1').length).toBeGreaterThan(0);
    expect(screen.getByTestId('magic-card-image-image-a.jpg')).toBeInTheDocument();
    expect(screen.queryByTestId('magic-card-image-image-b.jpg')).not.toBeInTheDocument();
    expect(screen.queryByText('Cycle 2')).not.toBeInTheDocument();
  });

  it('should not render lands already in the deck', () => {
    (useGetDeckById as jest.Mock).mockReturnValue({
      isWaitingForDeck: false,
      deckById: [{ card: { cardName: 'Land A' } }],
      deckByIdError: null,
    });
    (getDeckColorIdentity as jest.Mock).mockReturnValue('WU');
    render(<LandCycles />);

    expect(screen.queryByTestId('magic-card-image-image-a.jpg')).not.toBeInTheDocument();
    expect(screen.getByTestId('magic-card-image-image-b.jpg')).toBeInTheDocument();
  });

  it('should show overlay with card details on card click', async () => {
    const mockCardDetails = { name: 'Land B' };
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCardDetails);
    (getDeckColorIdentity as jest.Mock).mockReturnValue('U');

    render(<LandCycles />);
    const landBImage = screen.getByTestId('magic-card-image-image-b.jpg');
    fireEvent.click(landBImage.parentElement!); // Click the parent <li>

    await waitFor(() => {
      expect(screen.getByTestId('overlay-wrapper')).toBeInTheDocument();
      expect(screen.getByText('Add to deck')).toBeInTheDocument();
      expect(screen.getByTestId('full-card-info')).toHaveTextContent('Land B');
    });
  });

  it('should add card to deck and close overlay on button click', async () => {
    const mockCardDetails = { name: 'Land B' };
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCardDetails);
    (getDeckColorIdentity as jest.Mock).mockReturnValue('U');

    render(<LandCycles />);
    const landBImage = screen.getByTestId('magic-card-image-image-b.jpg');
    fireEvent.click(landBImage.parentElement!);

    await waitFor(() => {
      expect(screen.getByTestId('overlay-wrapper')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add to deck');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAddCard).toHaveBeenCalledWith(mockCardDetails);
      expect(screen.queryByTestId('overlay-wrapper')).not.toBeInTheDocument();
    });
  });
});
