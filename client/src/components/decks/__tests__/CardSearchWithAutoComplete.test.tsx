import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createPortal } from 'react-dom';
import CardSearchWithAutoComplete from '../CardSearchWithAutoComplete';
import { useScryfallAutoComplete, ScryfallApi } from '@/api/scryfallApi';

vi.mock('@/api/scryfallApi', () => ({
  useScryfallAutoComplete: vi.fn(),
  ScryfallApi: vi.fn(() => ({
    cardAutocomplete: vi.fn().mockResolvedValue(['Card A', 'Card B']),
  })),
}));

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('CardSearchWithAutoComplete', () => {
  const mockSetValue = vi.fn();
  const mockSetShowSuggestions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the input and label', () => {
    (useScryfallAutoComplete as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<CardSearchWithAutoComplete label="Search" value="" setValue={mockSetValue} showSuggestions setShowSuggestions={mockSetShowSuggestions} />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('should show autocomplete results when typing', async () => {
    (useScryfallAutoComplete as jest.Mock).mockReturnValue({
      data: ['Card A', 'Card B'],
      isLoading: false,
      isError: false,
    });

    render(<CardSearchWithAutoComplete label="Search" value="Card" setValue={mockSetValue} showSuggestions setShowSuggestions={mockSetShowSuggestions} />);
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'Card' } });

    await waitFor(() => expect(screen.getByText('Card A')).toBeInTheDocument());
    expect(screen.getByText('Card B')).toBeInTheDocument();
  });

  it('should hide autocomplete results when input is empty', () => {
    (useScryfallAutoComplete as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<CardSearchWithAutoComplete label="Search" value="" setValue={mockSetValue} showSuggestions setShowSuggestions={mockSetShowSuggestions} />);
    expect(screen.queryByText('Card A')).not.toBeInTheDocument();
  });

  it('should select a card from autocomplete and call setValue', async () => {
    (useScryfallAutoComplete as jest.Mock).mockReturnValue({
      data: ['Card A', 'Card B'],
      isLoading: false,
      isError: false,
    });

    render(<CardSearchWithAutoComplete label="Search" value="Card" setValue={mockSetValue} showSuggestions setShowSuggestions={mockSetShowSuggestions} />);
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'Card' } });

    await waitFor(() => expect(screen.getByText('Card A')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Card A'));

    expect(mockSetValue).toHaveBeenCalledWith('Card A');
    expect(mockSetShowSuggestions).toHaveBeenCalledWith(false);
  });

  it('should not show dropdown if no results', () => {
    (useScryfallAutoComplete as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<CardSearchWithAutoComplete label="Search" value="Card" setValue={mockSetValue} showSuggestions setShowSuggestions={mockSetShowSuggestions} />);
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });
});