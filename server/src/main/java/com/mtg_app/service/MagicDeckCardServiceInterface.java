package com.mtg_app.service;

import java.util.List;

import com.mtg_app.entity.MagicCard;
import com.mtg_app.entity.MagicDeck;
import com.mtg_app.entity.MagicDeckCard;

public interface MagicDeckCardServiceInterface {

    public MagicDeckCard createOrUpdateDeckCardMapping(MagicCard card, MagicDeck deck, boolean isCommander, int quantity);

    public List<MagicDeckCard> getAllCardByDeckId(int deckId);

    public void removeCardFromDeck(int deckID, int cardId);

    public void updateCardQuantity(int deckId, int cardId, int quantity);
    
    public void removeAllCardsFromDeck(int deckId);

    public void autoFillRemainingDeckWithBasicLands(int deckId, String userId);

    public void updateCardPrinting(int oldId, int newId);
}
