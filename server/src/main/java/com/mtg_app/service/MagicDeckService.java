package com.mtg_app.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.MagicDeckRepository;
import com.mtg_app.dto.ColorDistributionResponse;
import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.NewDeckRequest;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.entity.MagicDeck;
import com.mtg_app.entity.MagicDeckCard;
import com.mtg_app.tools.MagicCardParser;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

@Service
public class MagicDeckService implements MagicDeckServiceInterface {

    private final MagicDeckRepository magicDeckRepository;
    private final MagicDeckCardService magicDeckCardService;

    @Autowired
    public MagicDeckService(MagicDeckRepository magicDeckRepository, MagicDeckCardService magicDeckCardService) {
        this.magicDeckRepository = magicDeckRepository;
        this.magicDeckCardService = magicDeckCardService;
    }

    @Override
    public MagicDeck createDeck(NewDeckRequest deck, String userId) {
        MagicCardParser parser = new MagicCardParser();

        String deckName = deck.getDeckName();
        String deckTheme = deck.getTheme();
        List<MagicCardRequest> cards = deck.getDeckData();

        List<String> commmanders = new ArrayList<>();
        String deckIdentity = "";
        List<String> deckImages = new ArrayList<>();

        for (MagicCardRequest card : cards) {
            String cardName = card.getName();
            List<String> colorIdentity = card.getColor_identity();
            String identity = parser.getColorIdentity(colorIdentity);

            commmanders.add(cardName);
            deckIdentity += identity;
            deckImages.add(card.getDeckImage());
        }

        String parsedColorIdentity = parser.getUniqueColorsInIdentity(deckIdentity);

        MagicDeck newDeck = new MagicDeck(userId, deckName, deckTheme, commmanders, parsedColorIdentity, deckImages);
        return magicDeckRepository.save(newDeck);
    }

    @Override
    public MagicDeck updateDeck(MagicDeck deckToUpdate) {
        return this.magicDeckRepository.save(deckToUpdate);
    }

    @Override
    public List<MagicDeck> getAllDecksByUserId(String userId) {
        return this.magicDeckRepository.getAllDecksByUserId(userId);
    }

    @Override
    public MagicDeck getDeckByDeckIdAndUserId(int deckId, String userId) {
        return magicDeckRepository.getDeckByDeckIdAndUserId(deckId, userId);
    }

    @Override
    public void deleteDeck(int deckId, String userId) {
        this.magicDeckRepository.deleteDeckByDeckIdAndUserId(deckId, userId);
    }

    @Override
    public ColorDistributionResponse colorDistribution(int deckId, String userId) {
        List<MagicDeckCard> deckList = magicDeckCardService.getAllCardByDeckId(deckId);
        MagicCardParser parser = new MagicCardParser();
        return parser.colorDistribution(deckList);
    }

}
