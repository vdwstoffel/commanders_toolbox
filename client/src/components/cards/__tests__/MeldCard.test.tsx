import { render, screen, waitFor } from '@testing-library/react';
import MeldCard from '../MeldCard';
import { ScryfallApi, type MagicCard } from '@/api/scryfallApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/scryfallApi');
vi.mock('../CardInfoContainer', () => ({
  default: ({ name }: any) => <div data-testid="card-info-container">{name}</div>,
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('MeldCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render both the main card and the melded card', async () => {
    const mockMainCard: MagicCard = {
      name: 'Gisela, the Broken Blade',
      layout: 'meld',
      image_uris: { large: 'gisela.jpg' },
      oracle_text: 'Gisela oracle',
      type_line: 'Legendary Creature',
      flavor_text: 'Gisela flavor',
      all_parts: [
        { component: 'meld_part', name: 'Gisela, the Broken Blade', uri: '' },
        { component: 'meld_part', name: 'Bruna, the Fading Light', uri: '' },
        { component: 'meld_result', name: 'Brisela, Voice of Nightmares', uri: '' },
      ],
    } as MagicCard;

    const mockMeldedCard: MagicCard = {
      name: 'Brisela, Voice of Nightmares',
      layout: 'meld',
      image_uris: { large: 'brisela.jpg' },
      oracle_text: 'Brisela oracle',
      type_line: 'Legendary Creature',
      flavor_text: 'Brisela flavor',
    } as MagicCard;

    (ScryfallApi.prototype.getCardByName as jest.Mock)
      .mockResolvedValueOnce(mockMeldedCard);

    render(<MeldCard card={mockMainCard} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Gisela, the Broken Blade')).toBeInTheDocument();
      expect(screen.getByText('Brisela, Voice of Nightmares')).toBeInTheDocument();
    });
  });

  it('should not render if card or meldedCard is null', () => {
    render(<MeldCard card={null as any} />, { wrapper });
    expect(screen.queryByTestId('card-info-container')).not.toBeInTheDocument();
  });
});
