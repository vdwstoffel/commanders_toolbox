import { render, screen } from '@testing-library/react';
import DoubleFacedCard from '../DoubleFacedCard';
import { type MagicCard } from '@/api/scryfallApi';

describe('DoubleFacedCard', () => {
  it('should render both card faces', () => {
    const mockCard: MagicCard = {
      name: 'Test Double Faced Card',
      card_faces: [
        {
          name: 'Front Face',
          type_line: 'Creature',
          oracle_text: 'Front oracle text',
          flavor_text: 'Front flavor text',
          image_uris: { large: 'front_image.jpg' },
        },
        {
          name: 'Back Face',
          type_line: 'Land',
          oracle_text: 'Back oracle text',
          flavor_text: 'Back flavor text',
          image_uris: { large: 'back_image.jpg' },
        },
      ],
    } as MagicCard;

    render(<DoubleFacedCard card={mockCard} />);

    expect(screen.getByText('Front Face')).toBeInTheDocument();
    expect(screen.getByText('Back Face')).toBeInTheDocument();
  });
});
