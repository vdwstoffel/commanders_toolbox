import { render, screen } from '@testing-library/react';
import AdventureCard from '../AdventureCard';
import { type MagicCard } from '@/api/scryfallApi';

describe('AdventureCard', () => {
  it('should render both card faces', () => {
    const mockCard: MagicCard = {
      name: 'Test Card',
      image_uris: { large: '' },
      card_faces: [
        {
          name: 'Creature Face',
          type_line: 'Creature',
          oracle_text: 'Creature oracle text',
          flavor_text: 'Creature flavor text',
        },
        {
          name: 'Adventure Face',
          type_line: 'Instant - Adventure',
          oracle_text: 'Adventure oracle text',
          flavor_text: 'Adventure flavor text',
        },
      ],
    } as MagicCard;

    render(<AdventureCard card={mockCard} />);

    expect(screen.getByText('Creature Face')).toBeInTheDocument();
    expect(screen.getByText('Adventure Face')).toBeInTheDocument();
  });
});
