package com.mtg_app.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.MagicCardRepository;
import com.mtg_app.dao.MagicDeckCardRepository;
import com.mtg_app.dao.MagicDeckRepository;
import com.mtg_app.dto.ColorDistributionResponse;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.entity.MagicDeck;
import com.mtg_app.entity.MagicDeckCard;
import com.mtg_app.tools.MagicCardParser;

import jakarta.transaction.Transactional;

@Service
public class MagicDeckCardService implements MagicDeckCardServiceInterface {

    private final MagicDeckCardRepository magicDeckCardRepository;
    private final MagicDeckRepository magicDeckRepository;
    private final MagicCardRepository magicCardRepository;

    @Autowired
    public MagicDeckCardService(MagicDeckCardRepository magicDeckCardRepository,
            MagicDeckRepository magicDeckRepository, MagicCardRepository magicCardRepository) {
        this.magicDeckCardRepository = magicDeckCardRepository;
        this.magicDeckRepository = magicDeckRepository;
        this.magicCardRepository = magicCardRepository;

    }

    @Override
    @Transactional
    public MagicDeckCard createOrUpdateDeckCardMapping(MagicCard card, MagicDeck deck, boolean isCommander,
            int quantity) {

        // first check if the card is already in the deck. If not create it otherwise
        // update the quantity
        MagicDeckCard exists = this.magicDeckCardRepository.getCardEntryByDeckIdAndCardId(deck.getDeckId(),
                card.getId());
        if (exists == null) {
            MagicDeckCard mapping = new MagicDeckCard(card, deck, isCommander, quantity);
            return this.magicDeckCardRepository.save(mapping);
        }

        int updatedQuantity = exists.getQuantity() + quantity;
        exists.setQuantity(updatedQuantity);
        return this.magicDeckCardRepository.save(exists);
    }

    @Override
    public List<MagicDeckCard> getAllCardByDeckId(int deckId) {
        return this.magicDeckCardRepository.getAllCardsByDeckId(deckId);
    }

    @Override
    public void updateCardQuantity(int deckId, int cardId, int quantity) {
        this.magicDeckCardRepository.updateCardQuantityByDeckIdAndCardId(deckId, cardId, quantity);
    }

    @Override
    public void removeCardFromDeck(int deckId, int cardId) {
        this.magicDeckCardRepository.deleteCardFromDeck(deckId, cardId);
    }

    @Override
    public void removeAllCardsFromDeck(int deckId) {
        this.magicDeckCardRepository.removeAllCardsFromDeck(deckId);
    }

    @Override
    @Transactional
    public void autoFillRemainingDeckWithBasicLands(int deckId, String userId) {

        final int MAX_DECK_SIZE = 100;

        MagicDeck deck = this.magicDeckRepository.getDeckByDeckIdAndUserId(deckId, userId);
        if (deck == null) {
            throw new RuntimeException("Deck not found for the given user");
        }

        // Count everything except basic lands - basic lands are recomputed from scratch below
        List<MagicDeckCard> deckListMapping = this.magicDeckCardRepository.getAllCardsByDeckId(deckId);
        Set<String> basicLandNames = Set.of("Island", "Mountain", "Swamp", "Plains", "Forest");
        int nonBasicCardCount = deckListMapping.stream()
                .filter(card -> !basicLandNames.contains(card.getCard().getCardName()))
                .mapToInt(MagicDeckCard::getQuantity)
                .sum();
        int spaceAvailableInDeck = MAX_DECK_SIZE - nonBasicCardCount;

        // Remove any basic lands already in the deck so lands from colors that are no
        // longer present don't linger, and the recomputed counts replace (not stack on)
        // the existing quantities.
        List<MagicDeckCard> existingBasics = this.magicDeckCardRepository.getBasicLandsInDeckByDeckId(deckId);
        for (MagicDeckCard basic : existingBasics) {
            this.magicDeckCardRepository.deleteCardFromDeck(deckId, basic.getCard().getId());
        }

        if (spaceAvailableInDeck <= 0) {
            return;
        }

        // Percentage of each color across the (non-land) cards in the deck
        ColorDistributionResponse colorDistribution = new MagicCardParser().colorDistribution(deckListMapping);
        Map<String, Double> landPercentages = new LinkedHashMap<>();
        landPercentages.put("Plains", colorDistribution.getWhite());
        landPercentages.put("Island", colorDistribution.getBlue());
        landPercentages.put("Swamp", colorDistribution.getBlack());
        landPercentages.put("Mountain", colorDistribution.getRed());
        landPercentages.put("Forest", colorDistribution.getGreen());

        // Largest-remainder distribution so the added lands fill the open slots exactly
        Map<String, Integer> requiredLands = new MagicCardParser().distributeLands(landPercentages, spaceAvailableInDeck);

        for (Map.Entry<String, Integer> entry : requiredLands.entrySet()) {
            if (entry.getValue() > 0) {
                MagicCard card = this.magicCardRepository.getCardByName(entry.getKey());
                this.createOrUpdateDeckCardMapping(card, deck, false, entry.getValue());
            }
        }
    }

    @Override
    public void updateCardPrinting(int oldId, int newId) {
        this.magicDeckCardRepository.updateCardPrinting(oldId, newId);
    }

}
