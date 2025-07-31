import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CardSearchWithAutoComplete from '../CardSearchWithAutoComplete';
import { ScryfallApi } from '@/api/scryfallApi';

vi.mock('@/api/scryfallApi');

// Mock createPortal to render its children directly
import { render as rtlRender } from '@testing-library/react';

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPortal: (node: any, container: Element) => {
      // For testing, we can append the node directly to the container
      // or a specific test container if needed.
      // This bypasses the actual portal behavior but allows testing content.
      if (container) {
        return container.appendChild(node);
      }
      return node;
    },
  };
});

describe('CardSearchWithAutoComplete', () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the input and label', () => {
    render(<CardSearchWithAutoComplete label="Card Name" setValue={mockSetValue} />);
    expect(screen.getByLabelText('Card Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show autocomplete results when typing', async () => {
    (ScryfallApi.prototype.cardAutocomplete as jest.Mock).mockResolvedValue([
      'Card A',
      'Card B',
    ]);

    render(<CardSearchWithAutoComplete label="Card Name" setValue={mockSetValue} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Card' } });

    await waitFor(() => expect(screen.getByText('Card A')).toBeInTheDocument());
    expect(screen.getByText('Card B')).toBeInTheDocument();
  });

  it('should hide autocomplete results when input is empty', async () => {
    (ScryfallApi.prototype.cardAutocomplete as jest.Mock).mockResolvedValue([
      'Card A',
    ]);

    render(<CardSearchWithAutoComplete label="Card Name" setValue={mockSetValue} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Card' } });
    await waitFor(() => expect(screen.getByText('Card A')).toBeInTheDocument());

    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => expect(screen.queryByText('Card A')).not.toBeInTheDocument());
  });

  it('should select a card from autocomplete and call setValue', async () => {
    const mockCard = { name: 'Selected Card' } as any;
    (ScryfallApi.prototype.cardAutocomplete as jest.Mock).mockResolvedValue([
      'Selected Card',
    ]);
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(mockCard);

    render(<CardSearchWithAutoComplete label="Card Name" setValue={mockSetValue} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Selected' } });
    await waitFor(() => expect(screen.getByText('Selected Card')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Selected Card'));

    expect(input).toHaveValue('Selected Card');
    expect(mockSetValue).toHaveBeenCalledWith(mockCard);
    expect(screen.queryByText('Selected Card')).not.toBeInTheDocument(); // Dropdown should hide
  });

  it('should not show dropdown if no results', async () => {
    (ScryfallApi.prototype.cardAutocomplete as jest.Mock).mockResolvedValue([]);

    render(<CardSearchWithAutoComplete label="Card Name" setValue={mockSetValue} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'NonExistent' } });

    await waitFor(() => expect(screen.queryByRole('list')).not.toBeInTheDocument());
  });
});
