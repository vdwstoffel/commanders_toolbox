import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ShowUniquePrintings from '../ShowUniquePrintings';
import { ScryfallApi, type MagicCard, type PrintingData } from '@/api/scryfallApi';

vi.mock('@/api/scryfallApi');
vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: any) => <div data-testid="carousel">{children}</div>,
  CarouselContent: ({ children }: any) => <div data-testid="carousel-content">{children}</div>,
  CarouselItem: ({ children }: any) => <div data-testid="carousel-item">{children}</div>,
  CarouselNext: () => <button data-testid="carousel-next">Next</button>,
  CarouselPrevious: () => <button data-testid="carousel-prev">Previous</button>,
}));
vi.mock('../MagicCardImage', () => ({
  default: ({ imageUrl, clickFunction }: any) => (
    <img data-testid="magic-card-image" src={imageUrl} alt="Magic Card" onClick={clickFunction} />
  ),
}));
vi.mock('../ui/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../ui/ErrorMessage', () => ({ default: ({ msg }: { msg: string }) => <div data-testid="error-message">{msg}</div> }));

describe('ShowUniquePrintings', () => {
  const mockSetCardFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loader when fetching printings', () => {
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<ShowUniquePrintings cardName="Test Card" setCardFn={mockSetCardFn} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display error message when fetching printings fails', async () => {
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockRejectedValue(new Error('Failed to fetch card'));
    render(<ShowUniquePrintings cardName="Test Card" setCardFn={mockSetCardFn} />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument());
    expect(screen.getByText('Error fetching data')).toBeInTheDocument();
  });

  it('should render unique printings', async () => {
    const mockCard: MagicCard = { oracle_id: '123' } as MagicCard;
    const mockPrintings: PrintingData[] = [
      { tcgplayer_id: 1, imageUrl: 'image1.jpg' },
      { tcgplayer_id: 2, imageUrl: 'image2.jpg' },
    ];

    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    (ScryfallApi.prototype.getAllPrintings as jest.Mock).mockResolvedValue(mockPrintings);

    render(<ShowUniquePrintings cardName="Test Card" setCardFn={mockSetCardFn} />);

    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument());

    expect(screen.getByTestId('carousel')).toBeInTheDocument();
    expect(screen.getAllByTestId('magic-card-image')).toHaveLength(2);
    expect(screen.getAllByAltText('Magic Card')[0]).toHaveAttribute('src', 'image1.jpg');
  });

  it('should call setCardFn with the selected card when a printing is clicked', async () => {
    const mockCard: MagicCard = { oracle_id: '123' } as MagicCard;
    const mockPrintings: PrintingData[] = [
      { tcgplayer_id: 1, imageUrl: 'image1.jpg' },
    ];
    const mockSelectedCard: MagicCard = { name: 'Selected Card' } as MagicCard;

    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    (ScryfallApi.prototype.getAllPrintings as jest.Mock).mockResolvedValue(mockPrintings);
    (ScryfallApi.prototype.getCardByTcgId as jest.Mock).mockResolvedValue(mockSelectedCard);

    render(<ShowUniquePrintings cardName="Test Card" setCardFn={mockSetCardFn} />);

    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument());

    fireEvent.click(screen.getByAltText('Magic Card'));

    await waitFor(() => expect(mockSetCardFn).toHaveBeenCalledWith(mockSelectedCard));
  });

  it('should display error message when fetching card details by tcgId fails', async () => {
    const mockCard: MagicCard = { oracle_id: '123' } as MagicCard;
    const mockPrintings: PrintingData[] = [
      { tcgplayer_id: 1, imageUrl: 'image1.jpg' },
    ];

    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);
    (ScryfallApi.prototype.getAllPrintings as jest.Mock).mockResolvedValue(mockPrintings);
    (ScryfallApi.prototype.getCardByTcgId as jest.Mock).mockRejectedValue(new Error('Failed to fetch card by tcgId'));

    render(<ShowUniquePrintings cardName="Test Card" setCardFn={mockSetCardFn} />);

    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument());

    fireEvent.click(screen.getByAltText('Magic Card'));

    await waitFor(() => expect(screen.getByText('Error fetching carddetails')).toBeInTheDocument());
  });
});
