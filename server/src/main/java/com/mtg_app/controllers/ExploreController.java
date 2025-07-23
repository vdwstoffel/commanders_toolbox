package com.mtg_app.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
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

    private final MagicCardRequest magicCardRequest;
    private final MagicCardService magicCardService;

    public ExploreController(MagicCardService magicCardService, MagicCardRequest magicCardRequest) {
        this.magicCardService = magicCardService;
        this.magicCardRequest = magicCardRequest;
    }

    @PostMapping
    public List<MagicCard> getBatchCardInfo(@RequestBody StringListOfCards cards ) {

        // first do a batch check if the cards exist in the database.
        List<String> existingCards = magicCardService.batchCheckIfCardsExist(cards.getCards());

        // Create a list of non existing cards
        List<String> cardsToCreate = new ArrayList<>();
        
        for (String card: cards.getCards()) {
            if (!existingCards.contains(card)) {
                cardsToCreate.add(card);
            }
        }

        System.out.println(cardsToCreate);
        // if that card does not exist create them
        if (cardsToCreate.size() > 0) {
            ScryfallApi scryfallApi = new ScryfallApi();
            List<MagicCardRequest> cardData = scryfallApi.getCardCollections(cardsToCreate);

            for (MagicCardRequest card: cardData) {
                magicCardService.getOrCreateNewCard(card);
            }
        }

        return magicCardService.getBatchCards(cards.getCards());
    }

}
