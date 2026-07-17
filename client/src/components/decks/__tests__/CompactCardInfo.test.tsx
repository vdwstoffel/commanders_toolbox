import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompactCardInfo from '../CompactCardInfo';
import { useParams } from 'react-router-dom';
import { useRemoveCardFromDeck, useUpdateCardQuantity, useUpdateCardPrinting, useAddCardToDeck, useEdhRecCommanderStats, useGetDeckById } from '../useDeckQuery';
import { useUser } from '../../user/useUser';
import { ScryfallApi } from '@/api/scryfallApi';

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}));
vi.mock('../useDeckQuery');
vi.mock('../../user/useUser');
vi.mock('@/api/scryfallApi');

vi.mock('../../ui/OverlayWrapper', () => ({ default: ({ children, hideFn }: any) => <div data-testid="overlay-wrapper" onClick={hideFn}>{children}</div> }));

vi.mock('../CardDetailDialog', () => ({
  default: ({ cardDetails, onClose }: any) => (
    <div data-testid="card-detail-dialog">
      {cardDetails.card.cardName}
      <button data-testid="dialog-close" onClick={onClose} />
    </div>
  ),
}));


describe('CompactCardInfo', () => {
  const mockRemoveCard = vi.fn();
  const mockUpdateCardQty = vi.fn();
  const mockUpdateCardPrinting = vi.fn();
  const mockAddCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ deckId: '123' });
    (useUser as jest.Mock).mockReturnValue({ idToken: 'mockToken' });
    (useRemoveCardFromDeck as jest.Mock).mockReturnValue({ removeCard: mockRemoveCard });
    (useUpdateCardQuantity as jest.Mock).mockReturnValue({ updateCardQty: mockUpdateCardQty });
    (useUpdateCardPrinting as jest.Mock).mockReturnValue({ updateCardPrinting: mockUpdateCardPrinting });
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addCard: mockAddCard });
    (useEdhRecCommanderStats as jest.Mock).mockReturnValue({ isPending: false, error: false, recs: [] });
    (useGetDeckById as jest.Mock).mockReturnValue({ deckById: [] });
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue({
      prices: { eur: '1.00', usd: '1.20' },
      rulings_uri: 'http://test.com/rulings',
    });
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockResolvedValue([]);
  });

  const mockCardDetails = {
    card: {
      id: 'card1',
      cardName: 'Test Card',
      manaSymbolUris: ['uri1', 'uri2'],
      tcgplayer_id: 123,
      prices: { eur: '1.00', usd: '1.20' },
      rulings_uri: 'http://test.com/rulings',
    },
    quantity: 1,
    commander: false,
  };

  it('should render card info correctly', () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getAllByAltText('manaSymbol')).toHaveLength(2);
  });

  it('should call removeCard when delete icon is clicked', () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    fireEvent.click(screen.getByTestId('delete-icon'));
    expect(mockRemoveCard).toHaveBeenCalledWith({ deckId: '123', cardId: 'card1', idToken: 'mockToken' });
  });

  it('should toggle card info overlay on card name click', async () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    fireEvent.click(screen.getByText('Test Card'));
    await waitFor(() => expect(screen.getByTestId('card-detail-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('dialog-close'));
    await waitFor(() => expect(screen.queryByTestId('card-detail-dialog')).not.toBeInTheDocument());
  });

  it('should enter edit mode on quantity double click', () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    fireEvent.doubleClick(screen.getByText('1'));
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('should update quantity on input change and blur', () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    fireEvent.doubleClick(screen.getByText('1'));
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(mockUpdateCardQty).toHaveBeenCalledWith({ cardId: 'card1', quantity: 5 });
  });

  it('should exit edit mode on escape key', () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    fireEvent.doubleClick(screen.getByText('1'));
    const input = screen.getByDisplayValue('1');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByDisplayValue('1')).not.toBeInTheDocument();
  });

  it('should update quantity on enter key', () => {
    render(<CompactCardInfo cardDetails={mockCardDetails} quantity={1} />);
    fireEvent.doubleClick(screen.getByText('1'));
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockUpdateCardQty).toHaveBeenCalledWith({ cardId: 'card1', quantity: 3 });
  });

  it('should not update quantity if card is commander', () => {
    const commanderCardDetails = { ...mockCardDetails, commander: true };
    render(<CompactCardInfo cardDetails={commanderCardDetails} quantity={1} />);
    fireEvent.doubleClick(screen.getByText('1'));
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(mockUpdateCardQty).not.toHaveBeenCalled();
  });

});