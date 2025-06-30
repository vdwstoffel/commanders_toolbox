package com.mtg_app.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.MagicDeckRepository;
import com.mtg_app.dto.ColorDistributionResponse;
import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.MagicCardRequest.AllParts;
import com.mtg_app.dto.NewDeckRequest;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.entity.MagicDeck;
import com.mtg_app.entity.MagicDeckCard;
import com.mtg_app.entity.MagicDeckCardToken;
import com.mtg_app.tools.MagicCardParser;

@Service
public class MagicDeckService implements MagicDeckServiceInterface {

    private final MagicDeckRepository magicDeckRepository;
    private final MagicDeckCardService magicDeckCardService;
    private final MagicCardService magicCardService;
    private final MagicDeckCardTokenService magicDeckCardTokenService;

    @Autowired
    public MagicDeckService(MagicDeckRepository magicDeckRepository, MagicDeckCardService magicDeckCardService, MagicCardService magicCardService, MagicDeckCardTokenService magicDeckCardTokenService) {
        this.magicDeckRepository = magicDeckRepository;
        this.magicDeckCardService = magicDeckCardService;
        this.magicCardService = magicCardService;
        this.magicDeckCardTokenService = magicDeckCardTokenService;
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

    /**
     * Adds a card to the specified Magic deck, including handling any associated token cards.
     *
     * <p>This method performs the following actions:
     * <ul>
     *   <li>Retrieves or creates a new {@link MagicCard} based on the provided {@link MagicCardRequest}.</li>
     *   <li>Adds the card to the deck using the deck-card mapping service.</li>
     *   <li>If the card has associated token parts (as indicated by {@code getAll_parts()}), 
     *       it identifies all tokens and creates deck-card-token mappings for each token.</li>
     * </ul>
     *
     * @param deck the {@link MagicDeck} to which the card will be added
     * @param card the {@link MagicCardRequest} containing card details and possible token parts
     */
    @Override
    public void addCardToDeck(MagicDeck deck, MagicCardRequest card, int quantity) {
        // get the card request id
        MagicCard newCard = this.magicCardService.getOrCreateNewCard(card);
        // add the card to the deck/card mapping
        this.magicDeckCardService.createOrUpdateDeckCardMapping(newCard, deck, false, quantity);

        // get the tokens associated with the card
        Map<String, Integer> possibleTokens = new HashMap<>();
        if (card.getAll_parts() != null) {
            for (AllParts token : card.getAll_parts()) {
                if (token.getType_line().contains("Token")) {
                    possibleTokens.put(token.getId(), newCard.getId());
                }
            }
            // add the token to the deck/card/token mapping
            if (possibleTokens.size() > 0) {
                for (Map.Entry<String, Integer> entry : possibleTokens.entrySet()) {
                    magicDeckCardTokenService.createDeckCardTokenMapping(
                            new MagicDeckCardToken(deck.getDeckId(), entry.getValue(), entry.getKey()));
                }
            }
        }
    }

}
