import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createPortal } from 'react-dom';
import CardSearchWithAutoComplete from '../CardSearchWithAutoComplete';
import { ScryfallApi } from '@/api/scryfallApi';

vi.mock('@/api/scryfallApi', () => ({
  useScryfallAutoComplete: vi.fn(),
  ScryfallApi: vi.fn(() => ({
    cardAutocomplete: vi.fn().mockResolvedValue(['Card A', 'Card B']),
    getCardByName: vi.fn().mockResolvedValue({
      id: 'card-a-id',
      cardName: 'Card A',
      manaCost: '{1}{U}',
      cmc: 2,
      cardType: 'Creature',
      cardText: 'Some text',
      power: '1',
      toughness: '1',
      loyalty: null,
      cardImageUrl: ['card-a.jpg'],
      manaSymbolUris: [],
      legalities: { commander: 'legal' },
      rulings: [],
      allPrintings: [],
    }),
  })),
}));

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('CardSearchWithAutoComplete', () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (ScryfallApi as jest.Mock).mockImplementation(() => ({
        cardAutocomplete: vi.fn().mockResolvedValue(['Card A', 'Card B']),
        getCardByName: vi.fn().mockResolvedValue({
            id: 'card-a-id',
            cardName: 'Card A',
            manaCost: '{1}{U}',
            cmc: 2,
            cardType: 'Creature',
            cardText: 'Some text',
            power: '1',
            toughness: '1',
            loyalty: null,
            cardImageUrl: ['card-a.jpg'],
            manaSymbolUris: [],
            legalities: { commander: 'legal' },
            rulings: [],
            allPrintings: [],
        }),
    }));
  });

  it('should render the input and label', () => {
    render(<CardSearchWithAutoComplete label="Search" setValue={mockSetValue} />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('should show autocomplete results when typing', async () => {
    render(<CardSearchWithAutoComplete label="Search" setValue={mockSetValue} />);
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'Card' } });

    await waitFor(() => expect(screen.getByText('Card A')).toBeInTheDocument());
    expect(screen.getByText('Card B')).toBeInTheDocument();
  });

  it('should hide autocomplete results when input is empty', () => {
    render(<CardSearchWithAutoComplete label="Search" setValue={mockSetValue} />);
    expect(screen.queryByText('Card A')).not.toBeInTheDocument();
  });

  it('should select a card from autocomplete and call setValue', async () => {
    render(<CardSearchWithAutoComplete label="Search" setValue={mockSetValue} />);
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'Card' } });

    await waitFor(() => expect(screen.getByText('Card A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Card A'));

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith({
        id: 'card-a-id',
        cardName: 'Card A',
        manaCost: '{1}{U}',
        cmc: 2,
        cardType: 'Creature',
        cardText: 'Some text',
        power: '1',
        toughness: '1',
        loyalty: null,
        cardImageUrl: ['card-a.jpg'],
        manaSymbolUris: [],
        legalities: { commander: 'legal' },
        rulings: [],
        allPrintings: [],
      });
    });
  });

  it('should not show dropdown if no results', async () => {
    (ScryfallApi as jest.Mock).mockImplementation(() => ({
        cardAutocomplete: vi.fn().mockResolvedValue([]),
        getCardByName: vi.fn(),
    }));

    render(<CardSearchWithAutoComplete label="Search" setValue={mockSetValue} />);
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'Card' } });

    await waitFor(() => {
        expect(screen.queryByText('Card A')).not.toBeInTheDocument();
    });
  });
});