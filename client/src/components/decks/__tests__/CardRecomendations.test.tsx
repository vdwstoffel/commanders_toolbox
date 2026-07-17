import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CardRecommendations from '../CardRecomendations';
import { useEdhRecCommanderStats, useGetDeckById, useAddCardToDeck } from '../useDeckQuery';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { getCardByName } = vi.hoisted(() => ({ getCardByName: vi.fn() }));

vi.mock('../useDeckQuery');
// Preserve the real scryfallImageFromId export (the component uses it) while making
// `new ScryfallApi()` return a stub. The implementation is baked in at mock time so it
// works even though the component instantiates ScryfallApi at module scope.
vi.mock('@/api/scryfallApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/scryfallApi')>();
  return { ...actual, ScryfallApi: vi.fn(() => ({ getCardByName })) };
});
vi.mock('../ui/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../ui/CustomTabs', () => ({
  default: ({ tabs, tabHandler }: any) => (
    <div role="tabs">
      {tabs.map((tab: string, index: number) => (
        <button key={tab} onClick={() => tabHandler(index)}>{tab}</button>
      ))}
    </div>
  ),
}));
vi.mock('../AddCardDialog', () => ({
  default: ({ card, onClose }: any) => (
    <div data-testid="add-card-dialog">
      {card.name}
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('CardRecommendations', () => {
  const addCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGetDeckById as jest.Mock).mockReturnValue({ deckById: [] });
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addCard, addingCard: false });
  });

  it('should display loader when pending', () => {
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: true, error: false, recs: [] });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display error message when there is an error', () => {
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: true, recs: [] });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    expect(screen.getByText('Could not load Card Recommendations')).toBeInTheDocument();
  });

  it('renders tabs and a grid tile per card with inclusion % and image', () => {
    const mockRecs = [
      {
        header: 'Tab 1',
        cardviews: [{ id: '6a5d8fad-2ffd-4645-8c49-907999b6cecf', name: 'Card A', synergy: 0.8, num_decks: 56, potential_decks: 100 }],
      },
      { header: 'Tab 2', cardviews: [{ name: 'Card B', synergy: 0.9 }] },
    ];
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });

    expect(screen.getByRole('tabs')).toBeInTheDocument();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Card A')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Card A' })).toHaveAttribute(
      'src',
      'https://cards.scryfall.io/normal/front/6/a/6a5d8fad-2ffd-4645-8c49-907999b6cecf.jpg',
    );
  });

  it('dims cards already in the deck and shows an "In deck" badge', () => {
    const mockRecs = [
      {
        header: 'Tab 1',
        cardviews: [
          { id: 'a1b2', name: 'Card A', synergy: 0.8 },
          { id: 'c3d4', name: 'Card B', synergy: 0.7 },
        ],
      },
    ];
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    (useGetDeckById as jest.Mock).mockReturnValue({
      deckById: [{ card: { cardName: 'Card A' }, deck: { colorIdentity: '' } }],
    });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    // Card B is not in the deck, so the grid renders; Card A shows the "In deck" badge.
    expect(screen.getByText('In deck')).toBeInTheDocument();
    expect(screen.getByText('Card B')).toBeInTheDocument();
  });

  it('quick-adds a card with quantity 1 when the + button is clicked', async () => {
    const mockRecs = [{ header: 'Tab 1', cardviews: [{ id: 'a1b2', name: 'Card A', synergy: 0.8 }] }];
    const mockCard = { name: 'Card A' } as any;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    getCardByName.mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Add Card A' }));

    await waitFor(() => expect(addCard).toHaveBeenCalledWith({ card: mockCard, quantity: 1 }));
    expect(screen.queryByTestId('add-card-dialog')).not.toBeInTheDocument();
  });

  it('opens the AddCardDialog with the clicked recommendation and closes it', async () => {
    const mockRecs = [{ header: 'Tab 1', cardviews: [{ id: 'a1b2', name: 'Card A', synergy: 0.8 }] }];
    const mockCard = { name: 'Card A', image_uris: { large: 'cardA.jpg' }, prices: { eur: '1.00', usd: '1.20' }, rulings_uri: 'r' } as any;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    getCardByName.mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByText('Card A'));

    await waitFor(() => expect(screen.getByTestId('add-card-dialog')).toBeInTheDocument());
    expect(screen.getByTestId('add-card-dialog')).toHaveTextContent('Card A');

    fireEvent.click(screen.getByText('close'));
    await waitFor(() => expect(screen.queryByTestId('add-card-dialog')).not.toBeInTheDocument());
  });
});
