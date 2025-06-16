package com.mtg_app.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    public void autoFillRemainingDeckWithBasicLands(int deckId, String userId) {

        final int MAX_DECK_SIZE = 100;

        // first get the decklist and check how many spots are left
        List<MagicDeckCard> deckListMapping = this.magicDeckCardRepository.getAllCardsByDeckId(deckId);
        Set<String> excludedNames = Set.of("Island", "Mountain", "Swamp", "Plains", "Forest");
        int totalNumberOfCardsInDeck = deckListMapping.stream()
                .filter(card -> !excludedNames.contains(card.getCard().getCardName()))
                .mapToInt(MagicDeckCard::getQuantity)
                .sum();
        int spaceAvailableInDeck = MAX_DECK_SIZE - totalNumberOfCardsInDeck;

        // get a count of each manasymbol in the deck
        ColorDistributionResponse colorDistribution = new MagicCardParser().colorDistribution(deckListMapping);

        // Create a HashMap of each color for easy lookup when updating the quantities
        // of card to add
        Map<String, Integer> requiredLands = new HashMap<>();
        requiredLands.put("Plains", (int) Math.round(((colorDistribution.getWhite() / 100) * spaceAvailableInDeck)));
        requiredLands.put("Island", (int) Math.round(((colorDistribution.getBlue() / 100) * spaceAvailableInDeck)));
        requiredLands.put("Swamp", (int) Math.round(((colorDistribution.getBlack() / 100) * spaceAvailableInDeck)));
        requiredLands.put("Mountain", (int) Math.round(((colorDistribution.getRed() / 100) * spaceAvailableInDeck)));
        requiredLands.put("Forest", (int) Math.round(((colorDistribution.getGreen() / 100) * spaceAvailableInDeck)));

        // Get all the basic lands that are already in the deck
        List<MagicDeckCard> basicLands = this.magicDeckCardRepository.getBasicLandsInDeckByDeckId(deckId);
        MagicDeck deck = this.magicDeckRepository.getDeckByDeckIdAndUserId(deckId, userId);

        // Go through the requireland and check what must be added to the deck
        for (Map.Entry<String, Integer> entry : requiredLands.entrySet()) {
            // Check if we actually want to add the basic lands to the deck
            if (entry.getValue() > 0) {
                Optional<MagicDeckCard> alreadyInDeck = basicLands.stream()
                        .filter(card -> card.getCard().getCardName().equals(entry.getKey())).findFirst();

                if (alreadyInDeck.isPresent()) {
                    // Set the value back to zero otherwise it will add the recommended value to the
                    // already existing value
                    alreadyInDeck.get().setQuantity(0);
                    this.createOrUpdateDeckCardMapping(alreadyInDeck.get().getCard(), deck, false, entry.getValue());
                } else {
                    MagicCard card = this.magicCardRepository.getCardByName(entry.getKey());
                    this.createOrUpdateDeckCardMapping(card, deck, false, entry.getValue());
                }
            }
        }
    }

}
