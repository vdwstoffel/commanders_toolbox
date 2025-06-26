package com.mtg_app.service;

import java.util.List;

import com.mtg_app.entity.MagicDeck;
import com.mtg_app.dto.ColorDistributionResponse;
import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.NewDeckRequest;

public interface MagicDeckServiceInterface {
    MagicDeck createDeck(NewDeckRequest newDeck, String userId);

    MagicDeck updateDeck(MagicDeck deckToUpdate);

    List<MagicDeck> getAllDecksByUserId(String userId);

    MagicDeck getDeckByDeckIdAndUserId(int deckId, String userId);

    void deleteDeck(int id, String userId);

    ColorDistributionResponse colorDistribution(int deckId, String userId);

    void addCardToDeck(MagicDeck deck, MagicCardRequest card);
}