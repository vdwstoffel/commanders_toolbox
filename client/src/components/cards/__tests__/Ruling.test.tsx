import { render, screen, waitFor } from '@testing-library/react';
import Ruling from '../Ruling';
import { ScryfallApi } from '@/api/scryfallApi';

vi.mock('@/api/scryfallApi');
vi.mock('../ui/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../ui/ErrorMessage', () => ({ default: ({ msg }: { msg: string }) => <div data-testid="error-message">{msg}</div> }));

describe('Ruling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loader when loading', () => {
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolve
    render(<Ruling rulingUri="http://test.com/rulings" />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display error message when fetching fails', async () => {
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockRejectedValue(new Error('Failed to fetch rulings'));
    render(<Ruling rulingUri="http://test.com/rulings" />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument());
    expect(screen.getByText('An unknown error occurred!')).toBeInTheDocument();
  });

  it('should display rulings when fetching is successful', async () => {
    const mockRulings = [
      { oracle_id: '1', comment: 'Rule 1', published_at: '2023-01-01' },
      { oracle_id: '2', comment: 'Rule 2', published_at: '2023-01-02' },
    ];
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockResolvedValue(mockRulings);
    render(<Ruling rulingUri="http://test.com/rulings" />);
    await waitFor(() => expect(screen.getByText('Rules')).toBeInTheDocument());
    expect(screen.getByText('Rule 1')).toBeInTheDocument();
    expect(screen.getByText('Rule 2')).toBeInTheDocument();
  });

  it('should not display rulings section if no rulings are returned', async () => {
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockResolvedValue([]);
    render(<Ruling rulingUri="http://test.com/rulings" />);
    await waitFor(() => expect(screen.queryByText('Rules')).not.toBeInTheDocument());
  });
});
