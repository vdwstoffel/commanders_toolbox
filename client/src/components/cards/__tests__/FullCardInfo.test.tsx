import { render, screen, waitFor } from '@testing-library/react';
import FullCardInfo from '../FullCardInfo';
import { ScryfallApi, type MagicCard } from '@/api/scryfallApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/scryfallApi');
vi.mock('../SingleFacedCard', () => ({ default: ({ card }: any) => <div data-testid="single-faced-card">{card.name}</div> }));
vi.mock('../DoubleFacedCard', () => ({ default: ({ card }: any) => <div data-testid="double-faced-card">{card.name}</div> }));
vi.mock('../AdventureCard', () => ({ default: ({ card }: any) => <div data-testid="adventure-card">{card.name}</div> }));
vi.mock('../MeldCard', () => ({ default: ({ card }: any) => <div data-testid="meld-card">{card.name}</div> }));
vi.mock('../Ruling', () => ({ default: () => <div data-testid="rulings">Rulings</div> }));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('FullCardInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loader when loading', () => {
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolve
    render(<FullCardInfo cardName="Test Card" />, { wrapper });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display error message when fetching fails', async () => {
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockRejectedValue(new Error('Card not found'));
    render(<FullCardInfo cardName="NonExistent Card" />, { wrapper });
    await waitFor(() => expect(screen.getByText('Card not found')).toBeInTheDocument());
  });

  it('should render SingleFacedCard for normal layout', async () => {
    const mockCard: MagicCard = {
      name: 'Single Card',
      layout: 'normal',
      prices: { eur: '1.00', usd: '1.20' },
    } as MagicCard;
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    render(<FullCardInfo cardName="Single Card" />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('single-faced-card')).toBeInTheDocument());
    expect(screen.getByText('Single Card')).toBeInTheDocument();
    expect(screen.getByText('EUR: 1.00')).toBeInTheDocument();
    expect(screen.getByText('USD: 1.20')).toBeInTheDocument();
    expect(screen.getByTestId('rulings')).toBeInTheDocument();
  });

  it('should render DoubleFacedCard for transform layout', async () => {
    const mockCard: MagicCard = {
      name: 'Double Card',
      layout: 'transform',
      prices: { eur: '2.00', usd: '2.50' },
    } as MagicCard;
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    render(<FullCardInfo cardName="Double Card" />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('double-faced-card')).toBeInTheDocument());
    expect(screen.getByText('Double Card')).toBeInTheDocument();
  });

  it('should render AdventureCard for adventure layout', async () => {
    const mockCard: MagicCard = {
      name: 'Adventure Card',
      layout: 'adventure',
      prices: { eur: '3.00', usd: '3.50' },
    } as MagicCard;
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    render(<FullCardInfo cardName="Adventure Card" />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('adventure-card')).toBeInTheDocument());
    expect(screen.getByText('Adventure Card')).toBeInTheDocument();
  });

  it('should render MeldCard for meld layout', async () => {
    const mockCard: MagicCard = {
      name: 'Meld Card',
      layout: 'meld',
      prices: { eur: '4.00', usd: '4.50' },
    } as MagicCard;
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    render(<FullCardInfo cardName="Meld Card" />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('meld-card')).toBeInTheDocument());
    expect(screen.getByText('Meld Card')).toBeInTheDocument();
  });
});
