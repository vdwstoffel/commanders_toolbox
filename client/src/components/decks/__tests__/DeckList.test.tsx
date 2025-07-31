import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeckList from '../DeckList';
import { useParams } from 'react-router-dom';
import { usePopulateBasicLands, useAddCardToDeck, useEdhRecCommanderStats, useGetDeckById } from '../useDeckQuery';
import { useUser } from '../../user/useUser';
import { BackendDeckApi } from '@/api/backendDeckApi';
import toast from 'react-hot-toast';

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}));
vi.mock('../useDeckQuery');
vi.mock('../../user/useUser');
vi.mock('@/api/backendDeckApi');
vi.mock('react-hot-toast');

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <>{children}</>,
  DropdownMenuCheckboxItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('../CardTypeContainer', () => ({
  default: ({ heading, cards, hoverFunc }: any) => (
    <div data-testid="card-type-container">
      <h3>{heading}</h3>
      {cards.map((card: any) => (
        <p key={card.id} onMouseEnter={() => hoverFunc(card.card.cardImageUrl[0])}>{card.card.cardName}</p>
      ))}
    </div>
  ),
}));

describe('DeckList', () => {
  const mockPopulateLands = vi.fn();
  const mockDownloadDeckList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ deckId: '123' });
    (useUser as jest.Mock).mockReturnValue({ idToken: 'mockToken' });
    (usePopulateBasicLands as jest.Mock).mockReturnValue({ populateLands: mockPopulateLands });
    (BackendDeckApi.prototype.downloadDeckList as jest.Mock).mockImplementation(mockDownloadDeckList);
    toast.success = vi.fn();
    toast.error = vi.fn();

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Mock createObjectURL
    window.URL.createObjectURL = vi.fn();
  });

  const mockDeck = [
    {
      id: '1',
      deck: { deckName: 'Test Deck' },
      card: {
        id: 'card1',
        cardName: 'Commander Card',
        manaSymbolUris: [],
        cardImageUrl: ['commander.jpg'],
        cmc: 5,
        cardType: 'creature',
      },
      quantity: 1,
      commander: true,
    },
    {
      id: '2',
      deck: { deckName: 'Test Deck' },
      card: {
        id: 'card2',
        cardName: 'Creature Card',
        manaSymbolUris: [],
        cardImageUrl: ['creature.jpg'],
        cmc: 2,
        cardType: 'creature',
      },
      quantity: 1,
      commander: false,
    },
    {
      id: '3',
      deck: { deckName: 'Test Deck' },
      card: {
        id: 'card3',
        cardName: 'Land Card',
        manaSymbolUris: [],
        cardImageUrl: ['land.jpg'],
        cmc: 0,
        cardType: 'land',
      },
      quantity: 1,
      commander: false,
    },
  ];

  it('should render deck list with categorized cards', () => {
    render(<DeckList deck={mockDeck} />);

    expect(screen.getByText('Commander Card')).toBeInTheDocument();
    expect(screen.getByText('Creature Card')).toBeInTheDocument();
    expect(screen.getByText('Land Card')).toBeInTheDocument();

    expect(screen.getByText('Commander')).toBeInTheDocument();
    expect(screen.getByText('Creatures')).toBeInTheDocument();
    expect(screen.getByText('Lands')).toBeInTheDocument();
  });

  it('should call populateLands when "Populate Lands" button is clicked', () => {
    render(<DeckList deck={mockDeck} />);
    fireEvent.click(screen.getByText('Populate Lands'));
    expect(mockPopulateLands).toHaveBeenCalledTimes(1);
  });

  it('should update card image on hover', () => {
    render(<DeckList deck={mockDeck} />);
    const initialImage = screen.getByTestId('magic-card-image');
    expect(initialImage).toHaveAttribute('src', 'commander.jpg');

    fireEvent.mouseEnter(screen.getByText('Creature Card'));
    expect(initialImage).toHaveAttribute('src', 'creature.jpg');
  });

  it('should download deck list to file', async () => {
    mockDownloadDeckList.mockResolvedValue('Deck list content');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    render(<DeckList deck={mockDeck} />);
    fireEvent.click(screen.getByText('Download deck'));

    await waitFor(() => expect(mockDownloadDeckList).toHaveBeenCalledWith(123, 'mockToken'));
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should copy deck list to clipboard', async () => {
    mockDownloadDeckList.mockResolvedValue('Deck list content');

    render(<DeckList deck={mockDeck} />);
    fireEvent.click(screen.getByText('Copy to clipboard'));

    await waitFor(() => expect(mockDownloadDeckList).toHaveBeenCalledWith(123, 'mockToken'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Deck list content');
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should show error toast if clipboard copy fails', async () => {
    mockDownloadDeckList.mockResolvedValue('Deck list content');
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Copy failed'));

    render(<DeckList deck={mockDeck} />);
    fireEvent.click(screen.getByText('Copy to clipboard'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error copying content to clipboard: Error: Copy failed'));
  });
});
