import { render, screen, waitFor } from '@testing-library/react';
import Ruling from '../Ruling';
import { ScryfallApi } from '@/api/scryfallApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/scryfallApi');

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('Ruling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing while loading', () => {
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolve
    const { container } = render(<Ruling rulingUri="http://test.com/rulings" />, { wrapper: makeWrapper() });
    expect(screen.queryByText('Rules')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when fetching fails', async () => {
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockRejectedValue(new Error('Failed to fetch rulings'));
    render(<Ruling rulingUri="http://test.com/rulings" />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.queryByText('Rules')).not.toBeInTheDocument());
  });

  it('should display rulings when fetching is successful', async () => {
    const mockRulings = [
      { oracle_id: '1', comment: 'Rule 1', published_at: '2023-01-01' },
      { oracle_id: '2', comment: 'Rule 2', published_at: '2023-01-02' },
    ];
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockResolvedValue(mockRulings);
    render(<Ruling rulingUri="http://test.com/rulings" />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByText('Rules')).toBeInTheDocument());
    expect(screen.getByText('Rule 1')).toBeInTheDocument();
    expect(screen.getByText('Rule 2')).toBeInTheDocument();
  });

  it('should not display rulings section if no rulings are returned', async () => {
    (ScryfallApi.prototype.getCardRulings as jest.Mock).mockResolvedValue([]);
    render(<Ruling rulingUri="http://test.com/rulings" />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.queryByText('Rules')).not.toBeInTheDocument());
  });
});
