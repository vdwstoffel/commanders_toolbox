package com.mtg_app.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.MagicCardRepository;
import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.MagicCardRequest.AllParts;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.tools.MagicCardParser;

@Service
public class MagicCardService implements MagicCardServiceInterface {
    private MagicCardRepository magicCardRepository;
    private MagicTokenService magicTokenService;

    @Autowired
    public MagicCardService(MagicCardRepository magicCardRepository,
            MagicTokenService magicTokenService) {
        this.magicCardRepository = magicCardRepository;
        this.magicTokenService = magicTokenService;
    }

    /**
     * Retrieves an existing {@link MagicCard} by its TCGPlayer ID or creates a new one if it does not exist.
     * <p>
     * This method parses the provided {@link MagicCardRequest} to extract card details,
     * checks if a card with the given ID already exists in the repository, and if not,
     * creates and saves a new {@link MagicCard} entity. Additionally, it processes any
     * associated token parts and ensures their existence via the {@code magicTokenService}.
     * </p>
     *
     * @param card the {@link MagicCardRequest} containing the card details to retrieve or create
     * @return the existing or newly created {@link MagicCard}
     */
    @Override
    public MagicCard getOrCreateNewCard(MagicCardRequest card) {

        MagicCardParser parser = new MagicCardParser();

        int id = card.getTcgplayer_id();
        String cardName = card.getName();
        String manaCost = card.getMana_cost();
        List<String> colorIdentity = card.getColor_identity();
        int cmc = card.getCmc();
        String cardType = card.getType_line();
        String layout = card.getLayout();
        List<String> imageUrl = card.getCardImages();

        String identity = parser.getColorIdentity(colorIdentity);
        List<String> manaSymbolUris = parser.getManaSymbolUris(manaCost);

        // First check if the card already exists, otherwise create it
        Optional<MagicCard> exists = this.getCardById(id);
        if (!exists.isPresent()) {
            MagicCard cardToCreate = new MagicCard(id, cardName, identity, manaSymbolUris, cmc,
                    parser.formattedType(cardType), layout,
                    imageUrl);
            MagicCard savedCard = this.magicCardRepository.save(cardToCreate);

            // Create any tokens associated with the card
            if (card.getAll_parts() != null) {
                List<AllParts> allParts = card.getAll_parts();
                for (AllParts part : allParts) {
                    if (part.getType_line().contains("Token")) {
                        this.magicTokenService.getOrCreateToken(part.getId());
                    }
                }
            }
            return savedCard;

        }
        return exists.get();
    }

    @Override
    public Optional<MagicCard> getCardById(int cardId) throws IllegalArgumentException {
        return magicCardRepository.findById(cardId);
    }

    @Override
    public List<String> batchCheckIfCardsExist(List<String> cards) {
        return magicCardRepository.batchCheckIfCardsExist(cards);
    }
}
