import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import FullCardInfo from './FullCardInfo';
import { ScryfallApi, type MagicCard } from '@/api/scryfallApi';
import type { AxiosError } from 'axios';

// Mock all the card components
jest.mock('./SingleFacedCard', () => ({
  __esModule: true,
  default: ({ card }: { card: MagicCard }) => <div data-testid="single-faced-card">{card.name}</div>
}));

jest.mock('./DoubleFacedCard', () => ({
  __esModule: true,
  default: ({ card }: { card: MagicCard }) => <div data-testid="double-faced-card">{card.name}</div>
}));

jest.mock('./AdventureCard', () => ({
  __esModule: true,
  default: ({ card }: { card: MagicCard }) => <div data-testid="adventure-card">{card.name}</div>
}));

jest.mock('./MeldCard', () => ({
  __esModule: true,
  default: ({ card }: { card: MagicCard }) => <div data-testid="meld-card">{card.name}</div>
}));

jest.mock('./Ruling', () => ({
  __esModule: true,
  default: ({ rulingUri }: { rulingUri: string }) => <div data-testid="rulings">Rulings: {rulingUri}</div>
}));

jest.mock('../ui/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>
}));

jest.mock('../ui/ErrorMessage', () => ({
  __esModule: true,
  default: ({ msg }: { msg: string }) => <div data-testid="error-message">{msg}</div>
}));

// Mock the ScryfallApi
jest.mock('@/api/scryfallApi', () => ({
  ScryfallApi: jest.fn()
}));

const mockScryfallApi = ScryfallApi as jest.MockedClass<typeof ScryfallApi>;

describe('FullCardInfo Component', () => {
  const mockGetCardByName = jest.fn();
  
  const createMockCard = (overrides: Partial<MagicCard> = {}): MagicCard => ({
    object: 'card',
    id: '12345',
    oracle_id: 'oracle-12345',
    multiverse_ids: [123456],
    name: 'Lightning Bolt',
    lang: 'en',
    released_at: '1993-08-05',
    uri: 'https://api.scryfall.com/cards/12345',
    scryfall_uri: 'https://scryfall.com/card/lea/161/lightning-bolt',
    layout: 'normal',
    highres_image: true,
    image_status: 'highres_scan',
    prices: {
      eur: '0.50',
      usd: '0.75',
      usd_foil: null,
      usd_etched: null,
      eur_foil: null,
      tix: null
    },
    rulings_uri: 'https://api.scryfall.com/cards/12345/rulings',
    mana_cost: '{R}',
    type_line: 'Instant',
    oracle_text: 'Lightning Bolt deals 3 damage to any target.',
    colors: ['R'],
    color_identity: ['R'],
    keywords: [],
    cmc: 1,
    rarity: 'common',
    set: 'LEA',
    set_name: 'Limited Edition Alpha',
    set_id: 'lea-id',
    set_type: 'core',
    set_uri: 'https://api.scryfall.com/sets/lea',
    set_search_uri: 'https://api.scryfall.com/cards/search?order=set&q=e%3Alea',
    scryfall_set_uri: 'https://scryfall.com/sets/lea',
    prints_search_uri: 'https://api.scryfall.com/cards/search?order=released&q=oracleid%3Aoracle-12345',
    collector_number: '161',
    digital: false,
    card_back_id: 'card-back-id',
    artist: 'Christopher Rush',
    artist_ids: ['artist-id'],
    illustration_id: 'illustration-id',
    border_color: 'black',
    frame: '1993',
    full_art: false,
    textless: false,
    booster: true,
    story_spotlight: false,
    games: ['paper', 'mtgo'],
    legalities: {
      standard: 'not_legal',
      future: 'not_legal',
      historic: 'not_legal',
      gladiator: 'not_legal',
      pioneer: 'not_legal',
      explorer: 'not_legal',
      modern: 'legal',
      legacy: 'legal',
      pauper: 'legal',
      vintage: 'legal',
      penny: 'legal',
      commander: 'legal',
      brawl: 'not_legal',
      historicbrawl: 'legal',
      alchemy: 'not_legal',
      paupercommander: 'legal',
      duel: 'legal',
      oldschool: 'legal',
      premodern: 'legal'
    },
    reserved: false,
    game_changer: false,
    foil: false,
    nonfoil: true,
    finishes: ['nonfoil'],
    oversized: false,
    promo: false,
    reprint: false,
    variation: false,
    related_uris: {
      gatherer: 'https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=123456',
      tcgplayer_infinite_articles: 'https://infinite.tcgplayer.com/search?contentMode=article&game=magic&partner=scryfall&q=Lightning+Bolt',
      tcgplayer_infinite_decks: 'https://infinite.tcgplayer.com/search?contentMode=deck&game=magic&partner=scryfall&q=Lightning+Bolt',
      edhrec: 'https://edhrec.com/route/?cc=Lightning+Bolt'
    },
    purchase_uris: {
      tcgplayer: 'https://shop.tcgplayer.com/product/productsearch?id=123456',
      cardmarket: 'https://www.cardmarket.com/en/Magic/Products/Search?referrer=scryfall&searchString=Lightning+Bolt',
      cardhoarder: 'https://www.cardhoarder.com/cards/123456?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall'
    },
    image_uris: {
      small: 'https://example.com/card-small.jpg',
      normal: 'https://example.com/card.jpg',
      large: 'https://example.com/card-large.jpg',
      png: 'https://example.com/card.png',
      art_crop: 'https://example.com/card-art.jpg',
      border_crop: 'https://example.com/card-border.jpg'
    },
    ...overrides
  });

  beforeEach(() => {
    mockScryfallApi.mockImplementation(() => ({
      getCardByName: mockGetCardByName,
      cardAutocomplete: jest.fn(),
      getCardByTcgId: jest.fn(),
      getCardRulings: jest.fn(),
      getAllPrintings: jest.fn(),
      getCollection: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loader initially', () => {
      mockGetCardByName.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loader when cardName changes', async () => {
      const mockCard = createMockCard();
      mockGetCardByName.mockResolvedValue(mockCard);
      
      const { rerender } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
      
      // Change card name to trigger new loading
      mockGetCardByName.mockImplementation(() => new Promise(() => {}));
      
      act(() => {
        rerender(<FullCardInfo cardName="Counterspell" />);
      });
      
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should hide loader after successful data fetch', async () => {
      const mockCard = createMockCard();
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      // Initially should show loader
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      
      // After data loads, loader should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const mockError: AxiosError = {
        name: 'AxiosError',
        message: 'Network Error',
        isAxiosError: true,
        toJSON: () => ({}),
        config: {} as any,
        code: 'NETWORK_ERROR'
      };
      
      mockGetCardByName.mockRejectedValue(mockError);
      
      render(<FullCardInfo cardName="Invalid Card" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should handle non-Axios errors gracefully', async () => {
      const genericError = new Error('Generic error');
      mockGetCardByName.mockRejectedValue(genericError);
      
      render(<FullCardInfo cardName="Invalid Card" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Generic error')).toBeInTheDocument();
      });
    });

    it('should handle errors with undefined message', async () => {
      const errorWithoutMessage = { name: 'Error' } as Error;
      mockGetCardByName.mockRejectedValue(errorWithoutMessage);
      
      render(<FullCardInfo cardName="Invalid Card" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should handle 404 errors specifically', async () => {
      const notFoundError: AxiosError = {
        name: 'AxiosError',
        message: 'Card not found',
        isAxiosError: true,
        toJSON: () => ({}),
        config: {} as any,
        code: '404',
        response: {
          status: 404,
          data: {},
          headers: {},
          config: {} as any,
          statusText: 'Not Found'
        }
      };
      
      mockGetCardByName.mockRejectedValue(notFoundError);
      
      render(<FullCardInfo cardName="Nonexistent Card" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Card not found')).toBeInTheDocument();
      });
    });
  });

  describe('Card Layout Rendering', () => {
    it('should render SingleFacedCard for normal layout', async () => {
      const mockCard = createMockCard({ layout: 'normal', name: 'Lightning Bolt' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('single-faced-card')).toBeInTheDocument();
        expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('double-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('adventure-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('meld-card')).not.toBeInTheDocument();
    });

    it('should render DoubleFacedCard for transform layout', async () => {
      const mockCard = createMockCard({ layout: 'transform', name: 'Delver of Secrets' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Delver of Secrets" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('double-faced-card')).toBeInTheDocument();
        expect(screen.getByText('Delver of Secrets')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('single-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('adventure-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('meld-card')).not.toBeInTheDocument();
    });

    it('should render DoubleFacedCard for modal_dfc layout', async () => {
      const mockCard = createMockCard({ layout: 'modal_dfc', name: 'Valki, God of Lies' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Valki, God of Lies" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('double-faced-card')).toBeInTheDocument();
        expect(screen.getByText('Valki, God of Lies')).toBeInTheDocument();
      });
    });

    it('should render AdventureCard for adventure layout', async () => {
      const mockCard = createMockCard({ layout: 'adventure', name: 'Brazen Borrower' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Brazen Borrower" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('adventure-card')).toBeInTheDocument();
        expect(screen.getByText('Brazen Borrower')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('single-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('double-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('meld-card')).not.toBeInTheDocument();
    });

    it('should render AdventureCard for split layout', async () => {
      const mockCard = createMockCard({ layout: 'split', name: 'Fire // Ice' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Fire // Ice" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('adventure-card')).toBeInTheDocument();
        expect(screen.getByText('Fire // Ice')).toBeInTheDocument();
      });
    });

    it('should render MeldCard for meld layout', async () => {
      const mockCard = createMockCard({ layout: 'meld', name: 'Brisela, Voice of Nightmares' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Brisela, Voice of Nightmares" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('meld-card')).toBeInTheDocument();
        expect(screen.getByText('Brisela, Voice of Nightmares')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('single-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('double-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('adventure-card')).not.toBeInTheDocument();
    });

    it('should not render any card component for unknown layout', async () => {
      const mockCard = createMockCard({ layout: 'unknown' as any, name: 'Strange Card' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Strange Card" />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('single-faced-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('double-faced-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('adventure-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('meld-card')).not.toBeInTheDocument();
      });
      
      // Should still display price and rulings sections
      expect(screen.getByText(/EUR:/)).toBeInTheDocument();
      expect(screen.getByText(/USD:/)).toBeInTheDocument();
      expect(screen.getByTestId('rulings')).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should display EUR and USD prices when available', async () => {
      const mockCard = createMockCard({
        prices: { eur: '1.25', usd: '1.50', usd_foil: null, usd_etched: null, eur_foil: null, tix: null }
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR: 1.25')).toBeInTheDocument();
        expect(screen.getByText('USD: 1.50')).toBeInTheDocument();
      });
    });

    it('should display null prices correctly', async () => {
      const mockCard = createMockCard({
        prices: { eur: null, usd: null, usd_foil: null, usd_etched: null, eur_foil: null, tix: null }
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR:')).toBeInTheDocument();
        expect(screen.getByText('USD:')).toBeInTheDocument();
      });
    });

    it('should display undefined prices correctly', async () => {
      const mockCard = createMockCard({
        prices: { eur: undefined, usd: undefined, usd_foil: null, usd_etched: null, eur_foil: null, tix: null }
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR:')).toBeInTheDocument();
        expect(screen.getByText('USD:')).toBeInTheDocument();
      });
    });

    it('should display mixed price availability', async () => {
      const mockCard = createMockCard({
        prices: { eur: '2.00', usd: null, usd_foil: null, usd_etched: null, eur_foil: null, tix: null }
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR: 2.00')).toBeInTheDocument();
        expect(screen.getByText('USD:')).toBeInTheDocument();
      });
    });

    it('should handle very high prices', async () => {
      const mockCard = createMockCard({
        prices: { eur: '1234.56', usd: '9999.99', usd_foil: null, usd_etched: null, eur_foil: null, tix: null }
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR: 1234.56')).toBeInTheDocument();
        expect(screen.getByText('USD: 9999.99')).toBeInTheDocument();
      });
    });

    it('should handle zero prices', async () => {
      const mockCard = createMockCard({
        prices: { eur: '0.00', usd: '0.00', usd_foil: null, usd_etched: null, eur_foil: null, tix: null }
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('EUR: 0.00')).toBeInTheDocument();
        expect(screen.getByText('USD: 0.00')).toBeInTheDocument();
      });
    });
  });

  describe('Rulings Display', () => {
    it('should render Rulings component with correct URI', async () => {
      const mockCard = createMockCard({
        rulings_uri: 'https://api.scryfall.com/cards/test-id/rulings'
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('rulings')).toBeInTheDocument();
        expect(screen.getByText('Rulings: https://api.scryfall.com/cards/test-id/rulings')).toBeInTheDocument();
      });
    });

    it('should handle empty rulings URI', async () => {
      const mockCard = createMockCard({
        rulings_uri: ''
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('rulings')).toBeInTheDocument();
        expect(screen.getByText('Rulings:')).toBeInTheDocument();
      });
    });

    it('should handle rulings URI with special characters', async () => {
      const specialUri = 'https://api.scryfall.com/cards/special-chars-!@#$%/rulings';
      const mockCard = createMockCard({
        rulings_uri: specialUri
      });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('rulings')).toBeInTheDocument();
        expect(screen.getByText(`Rulings: ${specialUri}`)).toBeInTheDocument();
      });
    });
  });

  describe('Component Re-rendering', () => {
    it('should refetch card data when cardName prop changes', async () => {
      const firstCard = createMockCard({ name: 'Lightning Bolt', layout: 'normal' });
      const secondCard = createMockCard({ name: 'Counterspell', layout: 'normal' });
      
      mockGetCardByName
        .mockResolvedValueOnce(firstCard)
        .mockResolvedValueOnce(secondCard);
      
      const { rerender } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      });
      
      expect(mockGetCardByName).toHaveBeenCalledWith('Lightning Bolt');
      expect(mockGetCardByName).toHaveBeenCalledTimes(1);
      
      rerender(<FullCardInfo cardName="Counterspell" />);
      
      await waitFor(() => {
        expect(screen.getByText('Counterspell')).toBeInTheDocument();
      });
      
      expect(mockGetCardByName).toHaveBeenCalledWith('Counterspell');
      expect(mockGetCardByName).toHaveBeenCalledTimes(2);
    });

    it('should not refetch data when cardName remains the same', async () => {
      const mockCard = createMockCard({ name: 'Lightning Bolt' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      const { rerender } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      });
      
      expect(mockGetCardByName).toHaveBeenCalledTimes(1);
      
      // Re-render with same cardName
      rerender(<FullCardInfo cardName="Lightning Bolt" />);
      
      // Should not trigger additional API call
      expect(mockGetCardByName).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid cardName changes', async () => {
      const cards = [
        createMockCard({ name: 'Card 1' }),
        createMockCard({ name: 'Card 2' }),
        createMockCard({ name: 'Card 3' })
      ];
      
      mockGetCardByName
        .mockResolvedValueOnce(cards[0])
        .mockResolvedValueOnce(cards[1])
        .mockResolvedValueOnce(cards[2]);
      
      const { rerender } = render(<FullCardInfo cardName="Card 1" />);
      
      await waitFor(() => {
        expect(screen.getByText('Card 1')).toBeInTheDocument();
      });
      
      rerender(<FullCardInfo cardName="Card 2" />);
      rerender(<FullCardInfo cardName="Card 3" />);
      
      await waitFor(() => {
        expect(screen.getByText('Card 3')).toBeInTheDocument();
      });
      
      expect(mockGetCardByName).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null card gracefully', async () => {
      mockGetCardByName.mockResolvedValue(null);
      
      render(<FullCardInfo cardName="Nonexistent Card" />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
      
      // Should not render any card components
      expect(screen.queryByTestId('single-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('double-faced-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('adventure-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('meld-card')).not.toBeInTheDocument();
    });

    it('should handle empty string cardName', async () => {
      const mockCard = createMockCard({ name: '' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="" />);
      
      await waitFor(() => {
        expect(mockGetCardByName).toHaveBeenCalledWith('');
      });
    });

    it('should handle special characters in cardName', async () => {
      const specialCardName = 'Ænema // Íce';
      const mockCard = createMockCard({ name: specialCardName });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName={specialCardName} />);
      
      await waitFor(() => {
        expect(mockGetCardByName).toHaveBeenCalledWith(specialCardName);
      });
    });

    it('should handle very long cardName', async () => {
      const longCardName = 'A'.repeat(1000);
      const mockCard = createMockCard({ name: longCardName });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName={longCardName} />);
      
      await waitFor(() => {
        expect(mockGetCardByName).toHaveBeenCalledWith(longCardName);
      });
    });

    it('should handle cardName with only whitespace', async () => {
      const whitespaceCardName = '   ';
      const mockCard = createMockCard({ name: whitespaceCardName });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName={whitespaceCardName} />);
      
      await waitFor(() => {
        expect(mockGetCardByName).toHaveBeenCalledWith(whitespaceCardName);
      });
    });

    it('should handle card with minimal data', async () => {
      const minimalCard = createMockCard({
        name: 'Minimal Card',
        prices: { eur: null, usd: null, usd_foil: null, usd_etched: null, eur_foil: null, tix: null },
        rulings_uri: '',
        layout: 'normal'
      });
      mockGetCardByName.mockResolvedValue(minimalCard);
      
      render(<FullCardInfo cardName="Minimal Card" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('single-faced-card')).toBeInTheDocument();
        expect(screen.getByText('EUR:')).toBeInTheDocument();
        expect(screen.getByText('USD:')).toBeInTheDocument();
        expect(screen.getByTestId('rulings')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should reset error state when new successful request is made', async () => {
      const mockError: AxiosError = {
        name: 'AxiosError',
        message: 'Network Error',
        isAxiosError: true,
        toJSON: () => ({}),
        config: {} as any,
        code: 'NETWORK_ERROR'
      };
      
      // First call fails
      mockGetCardByName.mockRejectedValueOnce(mockError);
      
      const { rerender } = render(<FullCardInfo cardName="Invalid Card" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      // Second call succeeds
      const mockCard = createMockCard({ name: 'Lightning Bolt' });
      mockGetCardByName.mockResolvedValue(mockCard);
      
      rerender(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('single-faced-card')).toBeInTheDocument();
      });
    });

    it('should reset card state when new request starts', async () => {
      const firstCard = createMockCard({ name: 'Lightning Bolt' });
      mockGetCardByName.mockResolvedValueOnce(firstCard);
      
      const { rerender } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      });
      
      // Start new request that will never resolve
      mockGetCardByName.mockImplementation(() => new Promise(() => {}));
      
      rerender(<FullCardInfo cardName="Counterspell" />);
      
      // Should show loader
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should maintain loading state consistently', async () => {
      let resolvePromise: (value: MagicCard) => void;
      const promise = new Promise<MagicCard>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockGetCardByName.mockReturnValue(promise);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      // Should be loading
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      
      // Resolve the promise
      const mockCard = createMockCard();
      resolvePromise(mockCard);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.getByTestId('single-faced-card')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should create ScryfallApi instance correctly', () => {
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      expect(ScryfallApi).toHaveBeenCalledWith();
    });

    it('should call getCardByName with correct parameter', async () => {
      const mockCard = createMockCard();
      mockGetCardByName.mockResolvedValue(mockCard);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(mockGetCardByName).toHaveBeenCalledWith('Lightning Bolt');
      });
    });

    it('should handle API timeout gracefully', async () => {
      const timeoutError: AxiosError = {
        name: 'AxiosError',
        message: 'Timeout Error',
        isAxiosError: true,
        toJSON: () => ({}),
        config: {} as any,
        code: 'ECONNABORTED'
      };
      
      mockGetCardByName.mockRejectedValue(timeoutError);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Timeout Error')).toBeInTheDocument();
      });
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError: AxiosError = {
        name: 'AxiosError',
        message: 'Too Many Requests',
        isAxiosError: true,
        toJSON: () => ({}),
        config: {} as any,
        code: '429',
        response: {
          status: 429,
          data: {},
          headers: {},
          config: {} as any,
          statusText: 'Too Many Requests'
        }
      };
      
      mockGetCardByName.mockRejectedValue(rateLimitError);
      
      render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Too Many Requests')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should cleanup properly when component unmounts', async () => {
      const mockCard = createMockCard();
      mockGetCardByName.mockResolvedValue(mockCard);
      
      const { unmount } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      await waitFor(() => {
        expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      });
      
      // Unmount component
      unmount();
      
      // Verify component is no longer in document
      expect(screen.queryByText('Lightning Bolt')).not.toBeInTheDocument();
    });

    it('should handle rapid cardName changes without race conditions', async () => {
      let resolveFirst: (value: MagicCard) => void;
      let resolveSecond: (value: MagicCard) => void;
      
      const firstPromise = new Promise<MagicCard>((resolve) => {
        resolveFirst = resolve;
      });
      
      const secondPromise = new Promise<MagicCard>((resolve) => {
        resolveSecond = resolve;
      });
      
      mockGetCardByName
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);
      
      const { rerender } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      // Immediately change card name before first resolves
      rerender(<FullCardInfo cardName="Counterspell" />);
      
      // Resolve second request first
      const secondCard = createMockCard({ name: 'Counterspell' });
      resolveSecond(secondCard);
      
      await waitFor(() => {
        expect(screen.getByText('Counterspell')).toBeInTheDocument();
      });
      
      // Now resolve first request (should not affect display)
      const firstCard = createMockCard({ name: 'Lightning Bolt' });
      resolveFirst(firstCard);
      
      // Should still show second card
      expect(screen.getByText('Counterspell')).toBeInTheDocument();
      expect(screen.queryByText('Lightning Bolt')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with repeated re-renders', async () => {
      const mockCard = createMockCard();
      mockGetCardByName.mockResolvedValue(mockCard);
      
      const { rerender } = render(<FullCardInfo cardName="Lightning Bolt" />);
      
      // Perform multiple re-renders with the same prop
      for (let i = 0; i < 10; i++) {
        rerender(<FullCardInfo cardName="Lightning Bolt" />);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      });
      
      // Should only have called the API once due to useEffect dependency
      expect(mockGetCardByName).toHaveBeenCalledTimes(1);
    });
  });
});