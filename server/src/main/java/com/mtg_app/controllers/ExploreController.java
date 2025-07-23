package com.mtg_app.controllers;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.StringListOfCards;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.service.MagicCardService;
import com.mtg_app.tools.ScryfallApi;

/*
 * This controller manages the the calls related to exploring decks
 */

@RestController
@RequestMapping("/api/v1/explore")
public class ExploreController {

    private final MagicCardService magicCardService;

    public ExploreController(MagicCardService magicCardService) {
        this.magicCardService = magicCardService;
    }

    @PostMapping
    public List<MagicCard> getBatchCardInfo(@RequestBody StringListOfCards cards) {
        if (cards == null || cards.getCards() == null || cards.getCards().isEmpty()) {
            throw new IllegalArgumentException("Cards list cannot be null or empty");
        }

        // Filter out null or empty card names
        List<String> validCardNames = cards.getCards().stream()
                .filter(Objects::nonNull)
                .filter(name -> !name.trim().isEmpty())
                .collect(Collectors.toList());

        if (validCardNames.isEmpty()) {
            throw new IllegalArgumentException("No valid card names provided");
        }

        // first do a batch check if the cards exist in the database.
        List<String> existingCards = magicCardService.batchCheckIfCardsExist(cards.getCards());

        // Create a list of non existing cards
        List<String> cardsToCreate = new ArrayList<>();

        for (String card : cards.getCards()) {
            if (!existingCards.contains(card)) {
                cardsToCreate.add(card);
            }
        }
        // if that card does not exist create them
        if (cardsToCreate.size() > 0) {
            ScryfallApi scryfallApi = new ScryfallApi();
            List<MagicCardRequest> cardData = scryfallApi.getCardCollections(cardsToCreate);

            for (MagicCardRequest card : cardData) {
                magicCardService.getOrCreateNewCard(card);
            }
        }

        List<MagicCard> cardsInAlphabeticalOrder = magicCardService.getBatchCards(cards.getCards());

        // Need to preserve the cards in the original order from the list that was sent,
        List<MagicCard> originalOrder = new ArrayList<>();
        // Mark the seen cards, to not send any duplicate data
        Set<String> seenCards = new HashSet<>();

        for (String cardName : cards.getCards()) {
            for (MagicCard cardEntity : cardsInAlphabeticalOrder) {
                if (cardEntity.getCardName().equals(cardName) && !seenCards.contains(cardName)) {
                    originalOrder.add(cardEntity);
                    seenCards.add(cardName);
                }
            }
        }

        return originalOrder;
    }

}
