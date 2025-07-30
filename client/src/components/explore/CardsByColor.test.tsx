import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardsByColor from './CardsByColor';
import type { ColorIdentity } from '@/api/edhRecApi';
import type { ExploreCardInfo } from '@/hooks/useExploreQuery';

// Mock the custom hook
vi.mock('@/hooks/useExploreQuery', () => ({
  useGetCommandersByColor: vi.fn(),
}));

// Mock the child components
vi.mock('../ui/Loader', () => ({
  default: () => <div data-testid="loader">Loading...</div>,
}));

vi.mock('../ui/ErrorMessage', () => ({
  default: ({ msg }: { msg: string }) => <div data-testid="error-message">{msg}</div>,
}));

vi.mock('./CardsByCollectionContainer', () => ({
  default: ({ cardCollection }: { cardCollection: ExploreCardInfo[][] }) => (
    <div data-testid="cards-collection-container">
      Cards: {JSON.stringify(cardCollection)}
    </div>
  ),
}));

import { useGetCommandersByColor } from '@/hooks/useExploreQuery';

const mockUseGetCommandersByColor = useGetCommandersByColor as vi.MockedFunction<typeof useGetCommandersByColor>;

describe('CardsByColor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should render Loader when waiting for commander data', () => {
      // Arrange
      const mockColor: ColorIdentity = 'W';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: true,
        commanderByColorError: null,
        commanderColorInfo: undefined,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cards-collection-container')).not.toBeInTheDocument();
    });

    it('should call useGetCommandersByColor with correct color parameter', () => {
      // Arrange
      const mockColor: ColorIdentity = 'U';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: true,
        commanderByColorError: null,
        commanderColorInfo: undefined,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(mockUseGetCommandersByColor).toHaveBeenCalledWith(mockColor);
      expect(mockUseGetCommandersByColor).toHaveBeenCalledTimes(1);
    });

    it('should handle loading state with different color identities', () => {
      // Arrange
      const colors: ColorIdentity[] = ['W', 'U', 'B', 'R', 'G', 'C'];
      
      colors.forEach((color) => {
        mockUseGetCommandersByColor.mockReturnValue({
          waitingForCommanderByColor: true,
          commanderByColorError: null,
          commanderColorInfo: undefined,
        });

        // Act
        const { unmount } = render(<CardsByColor color={color} />);

        // Assert
        expect(mockUseGetCommandersByColor).toHaveBeenCalledWith(color);
        expect(screen.getByTestId('loader')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Error States', () => {
    it('should render ErrorMessage when there is a commander data error', () => {
      // Arrange
      const mockColor: ColorIdentity = 'B';
      const mockError = new Error('Network error');
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: mockError,
        commanderColorInfo: undefined,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to load commander data')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cards-collection-container')).not.toBeInTheDocument();
    });

    it('should render ErrorMessage with correct message when error occurs', () => {
      // Arrange
      const mockColor: ColorIdentity = 'R';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: new Error('API timeout'),
        commanderColorInfo: undefined,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toHaveTextContent('Failed to load commander data');
    });

    it('should prioritize loading state over error state', () => {
      // Arrange
      const mockColor: ColorIdentity = 'G';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: true,
        commanderByColorError: new Error('Some error'),
        commanderColorInfo: undefined,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should handle different types of errors gracefully', () => {
      // Arrange
      const mockColor: ColorIdentity = 'B';
      const errorTypes = [
        new Error('Network timeout'),
        new TypeError('Invalid response format'),
        { message: 'Custom error object' } as Error,
        'String error' as any,
      ];

      errorTypes.forEach((error, index) => {
        mockUseGetCommandersByColor.mockReturnValue({
          waitingForCommanderByColor: false,
          commanderByColorError: error,
          commanderColorInfo: undefined,
        });

        // Act
        const { unmount } = render(<CardsByColor color={mockColor} />);

        // Assert
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to load commander data')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Success States', () => {
    it('should render CardByCollectionContainer when data is successfully loaded', () => {
      // Arrange
      const mockColor: ColorIdentity = 'W';
      const mockCommanderData: ExploreCardInfo[][] = [
        [
          {
            name: 'Elspeth, Knight-Errant',
            cardImage: 'https://example.com/elspeth.jpg',
          },
        ],
        [
          {
            name: 'Avacyn, Angel of Hope',
            cardImage: 'https://example.com/avacyn.jpg',
          },
        ],
      ];
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockCommanderData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should pass commanderColorInfo to CardByCollectionContainer', () => {
      // Arrange
      const mockColor: ColorIdentity = 'U';
      const mockCommanderData: ExploreCardInfo[][] = [
        [
          {
            name: 'Jace, the Mind Sculptor',
            cardImage: 'https://example.com/jace.jpg',
          },
        ],
      ];
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockCommanderData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      const containerElement = screen.getByTestId('cards-collection-container');
      expect(containerElement).toHaveTextContent(JSON.stringify(mockCommanderData));
    });

    it('should handle empty commander data', () => {
      // Arrange
      const mockColor: ColorIdentity = 'C';
      const mockCommanderData: ExploreCardInfo[][] = [];
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockCommanderData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      expect(screen.getByText(`Cards: ${JSON.stringify(mockCommanderData)}`)).toBeInTheDocument();
    });

    it('should handle partner commanders (dual face cards)', () => {
      // Arrange
      const mockColor: ColorIdentity = 'R';
      const mockCommanderData: ExploreCardInfo[][] = [
        [
          {
            name: 'Kydele, Chosen of Kruphix',
            cardImage: 'https://example.com/kydele.jpg',
          },
          {
            name: 'Vial Smasher the Fierce',
            cardImage: 'https://example.com/vial-smasher.jpg',
          },
        ],
      ];
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockCommanderData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      const containerElement = screen.getByTestId('cards-collection-container');
      expect(containerElement).toHaveTextContent('Kydele, Chosen of Kruphix');
      expect(containerElement).toHaveTextContent('Vial Smasher the Fierce');
    });

    it('should handle mixed single and partner commanders', () => {
      // Arrange
      const mockColor: ColorIdentity = 'G';
      const mockCommanderData: ExploreCardInfo[][] = [
        [
          {
            name: 'Ezuri, Renegade Leader',
            cardImage: 'https://example.com/ezuri.jpg',
          },
        ],
        [
          {
            name: 'Silas Renn, Seeker Adept',
            cardImage: 'https://example.com/silas.jpg',
          },
          {
            name: 'Akiri, Line-Slinger',
            cardImage: 'https://example.com/akiri.jpg',
          },
        ],
      ];
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockCommanderData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      const containerElement = screen.getByTestId('cards-collection-container');
      expect(containerElement).toHaveTextContent('Ezuri, Renegade Leader');
      expect(containerElement).toHaveTextContent('Silas Renn, Seeker Adept');
      expect(containerElement).toHaveTextContent('Akiri, Line-Slinger');
    });
  });

  describe('Color Identity Variations', () => {
    const colorIdentities: ColorIdentity[] = ['W', 'U', 'B', 'R', 'G', 'C'];

    colorIdentities.forEach((color) => {
      it(`should handle ${color} color identity correctly`, () => {
        // Arrange
        const mockCommanderData: ExploreCardInfo[][] = [
          [
            {
              name: `${color} Commander`,
              cardImage: `https://example.com/${color.toLowerCase()}-commander.jpg`,
            },
          ],
        ];
        mockUseGetCommandersByColor.mockReturnValue({
          waitingForCommanderByColor: false,
          commanderByColorError: null,
          commanderColorInfo: mockCommanderData,
        });

        // Act
        render(<CardsByColor color={color} />);

        // Assert
        expect(mockUseGetCommandersByColor).toHaveBeenCalledWith(color);
        expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      });
    });
  });

  describe('Component Re-rendering', () => {
    it('should re-fetch data when color prop changes', () => {
      // Arrange
      const initialColor: ColorIdentity = 'W';
      const newColor: ColorIdentity = 'U';
      const mockData: ExploreCardInfo[][] = [[{ name: 'Test Commander', cardImage: 'test.jpg' }]];
      
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockData,
      });

      // Act
      const { rerender } = render(<CardsByColor color={initialColor} />);
      expect(mockUseGetCommandersByColor).toHaveBeenCalledWith(initialColor);

      rerender(<CardsByColor color={newColor} />);

      // Assert
      expect(mockUseGetCommandersByColor).toHaveBeenCalledWith(newColor);
      expect(mockUseGetCommandersByColor).toHaveBeenCalledTimes(2);
    });

    it('should update display when hook data changes', () => {
      // Arrange
      const mockColor: ColorIdentity = 'B';
      const mockData: ExploreCardInfo[][] = [[{ name: 'Test Commander', cardImage: 'test.jpg' }]];
      
      mockUseGetCommandersByColor
        .mockReturnValueOnce({
          waitingForCommanderByColor: true,
          commanderByColorError: null,
          commanderColorInfo: undefined,
        })
        .mockReturnValueOnce({
          waitingForCommanderByColor: false,
          commanderByColorError: null,
          commanderColorInfo: mockData,
        });

      // Act
      const { rerender } = render(<CardsByColor color={mockColor} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      rerender(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined commanderColorInfo gracefully when not loading or error', () => {
      // Arrange
      const mockColor: ColorIdentity = 'G';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: undefined,
      });

      // Act & Assert - This tests the non-null assertion (!) in the component
      expect(() => render(<CardsByColor color={mockColor} />)).not.toThrow();
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
    });

    it('should handle commanders with complex card structures', () => {
      // Arrange
      const mockColor: ColorIdentity = 'W';
      const complexCommanderData: ExploreCardInfo[][] = [
        [
          {
            name: 'Akroma, Angel of Wrath // Akroma, Angel of Fury',
            cardImage: 'https://example.com/akroma-large.jpg',
          },
        ],
      ];
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: complexCommanderData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      const containerElement = screen.getByTestId('cards-collection-container');
      expect(containerElement).toHaveTextContent('Akroma, Angel of Wrath // Akroma, Angel of Fury');
    });

    it('should handle large datasets efficiently', () => {
      // Arrange
      const mockColor: ColorIdentity = 'U';
      const largeDataset: ExploreCardInfo[][] = Array.from({ length: 100 }, (_, index) => [
        {
          name: `Commander ${index + 1}`,
          cardImage: `https://example.com/commander-${index + 1}.jpg`,
        },
      ]);
      
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: largeDataset,
      });

      // Act
      const startTime = performance.now();
      render(<CardsByColor color={mockColor} />);
      const endTime = performance.now();

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      expect(endTime - startTime).toBeLessThan(100); // Should render quickly
    });

    it('should handle special characters in commander names', () => {
      // Arrange
      const mockColor: ColorIdentity = 'R';
      const specialCharacterData: ExploreCardInfo[][] = [
        [
          {
            name: 'Aleša, Who Smiles at Death',
            cardImage: 'https://example.com/alesha.jpg',
          },
        ],
        [
          {
            name: 'Zur the Enchanter',
            cardImage: 'https://example.com/zur.jpg',
          },
        ],
      ];
      
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: specialCharacterData,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
      const containerElement = screen.getByTestId('cards-collection-container');
      expect(containerElement).toHaveTextContent('Aleša, Who Smiles at Death');
      expect(containerElement).toHaveTextContent('Zur the Enchanter');
    });
  });

  describe('Hook Integration', () => {
    it('should handle hook returning null for all fields', () => {
      // Arrange
      const mockColor: ColorIdentity = 'C';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: null as any,
        commanderByColorError: null,
        commanderColorInfo: null as any,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      expect(screen.getByTestId('cards-collection-container')).toBeInTheDocument();
    });

    it('should handle hook throwing an error', () => {
      // Arrange
      const mockColor: ColorIdentity = 'W';
      mockUseGetCommandersByColor.mockImplementation(() => {
        throw new Error('Hook error');
      });

      // Act & Assert
      expect(() => render(<CardsByColor color={mockColor} />)).toThrow('Hook error');
    });

    it('should handle rapidly changing props', () => {
      // Arrange
      const colors: ColorIdentity[] = ['W', 'U', 'B', 'R', 'G'];
      const mockData: ExploreCardInfo[][] = [[{ name: 'Test', cardImage: 'test.jpg' }]];
      
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: null,
        commanderColorInfo: mockData,
      });

      // Act
      const { rerender } = render(<CardsByColor color={colors[0]} />);
      
      colors.forEach((color, index) => {
        if (index > 0) {
          rerender(<CardsByColor color={color} />);
        }
      });

      // Assert
      expect(mockUseGetCommandersByColor).toHaveBeenCalledTimes(colors.length);
      colors.forEach((color) => {
        expect(mockUseGetCommandersByColor).toHaveBeenCalledWith(color);
      });
    });
  });

  describe('Accessibility & User Experience', () => {
    it('should maintain consistent structure across all states', () => {
      // Arrange
      const mockColor: ColorIdentity = 'W';
      const states = [
        {
          waitingForCommanderByColor: true,
          commanderByColorError: null,
          commanderColorInfo: undefined,
          expectedTestId: 'loader',
        },
        {
          waitingForCommanderByColor: false,
          commanderByColorError: new Error('Test error'),
          commanderColorInfo: undefined,
          expectedTestId: 'error-message',
        },
        {
          waitingForCommanderByColor: false,
          commanderByColorError: null,
          commanderColorInfo: [[{ name: 'Test', cardImage: 'test.jpg' }]],
          expectedTestId: 'cards-collection-container',
        },
      ];

      states.forEach((state) => {
        mockUseGetCommandersByColor.mockReturnValue(state);
        
        // Act
        const { unmount } = render(<CardsByColor color={mockColor} />);

        // Assert
        expect(screen.getByTestId(state.expectedTestId)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should provide meaningful content for screen readers', () => {
      // Arrange
      const mockColor: ColorIdentity = 'B';
      mockUseGetCommandersByColor.mockReturnValue({
        waitingForCommanderByColor: false,
        commanderByColorError: new Error('Network error'),
        commanderColorInfo: undefined,
      });

      // Act
      render(<CardsByColor color={mockColor} />);

      // Assert
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('Failed to load commander data');
      expect(errorMessage.textContent).toBeTruthy();
    });
  });
});