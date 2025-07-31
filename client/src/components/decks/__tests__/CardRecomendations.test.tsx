import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CardRecommendations from '../CardRecomendations';
import { useEdhRecCommanderStats, useAddCardToDeck, useGetDeckById } from '../useDeckQuery';
import { ScryfallApi } from '@/api/scryfallApi';

vi.mock('../useDeckQuery');
vi.mock('@/api/scryfallApi');
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

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));


describe('CardRecommendations', () => {
  const mockAddCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addCard: mockAddCard });
    (useGetDeckById as jest.Mock).mockReturnValue({ deckById: [] });
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockResolvedValue([]);
  });

  it('should display loader when pending', () => {
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: true, error: false, recs: [] });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display error message when there is an error', () => {
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: true, recs: [] });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />);
    expect(screen.getByText('Could not load Card Recommendations')).toBeInTheDocument();
  });

  it('should render tabs and recommended cards', () => {
    const mockRecs = [
      { header: 'Tab 1', cardviews: [{ name: 'Card A', synergy: 0.8 }] },
      { header: 'Tab 2', cardviews: [{ name: 'Card B', synergy: 0.9 }] },
    ];
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    render(<CardRecommendations commander={['commander1']} theme="theme1" />);

    expect(screen.getByRole('tabs')).toBeInTheDocument();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Card A')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should show card info on hover', async () => {
    const mockRecs = [
      { header: 'Tab 1', cardviews: [{ name: 'Card A', synergy: 0.8 }] },
    ];
    const mockCard: MagicCard = { name: 'Card A', image_uris: { large: 'cardA.jpg' }, prices: { eur: '1.00', usd: '1.20' } } as MagicCard;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />);

    fireEvent.mouseEnter(screen.getByText('Card A'));

    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'cardA.jpg'));
  });

  it('should open and close card info overlay on click', async () => {
    const mockRecs = [
      { header: 'Tab 1', cardviews: [{ name: 'Card A', synergy: 0.8 }] },
    ];
    const mockCard: MagicCard = { name: 'Card A', image_uris: { large: 'cardA.jpg' }, prices: { eur: '1.00', usd: '1.20' }, rulings_uri: 'http://test.com/rulings' } as MagicCard;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />);

    fireEvent.click(screen.getByText('Card A'));

    await waitFor(() => expect(screen.getByTestId('overlay-wrapper')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('overlay-wrapper')); // Click to hide

    await waitFor(() => expect(screen.queryByTestId('overlay-wrapper')).not.toBeInTheDocument());
  });

  it('should add card to deck when "Add to Deck" button is clicked', async () => {
    const mockRecs = [
      { header: 'Tab 1', cardviews: [{ name: 'Card A', synergy: 0.8 }] },
    ];
    const mockCard: MagicCard = { name: 'Card A', image_uris: { large: 'cardA.jpg' }, prices: { eur: '1.00', usd: '1.20' }, rulings_uri: 'http://test.com/rulings' } as MagicCard;
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: mockRecs });
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);

    render(<CardRecommendations commander={['commander1']} theme="theme1" />);

    fireEvent.click(screen.getByText('Card A'));

    await waitFor(() => expect(screen.getByText('Add to Deck')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Add to Deck'));

    expect(mockAddCard).toHaveBeenCalledWith(mockCard);
    expect(screen.queryByTestId('overlay-wrapper')).not.toBeInTheDocument();
  });
});
