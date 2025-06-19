package com.mtg_app.service;

import java.util.List;

import com.mtg_app.entity.MagicDeckCardToken;
import com.mtg_app.entity.MagicToken;

public interface MagicDeckCardTokenServiceInterface {
    MagicDeckCardToken createDeckCardTokenMapping(MagicDeckCardToken tokenMapping);

    void removeTokensFromDeckByCard(int deckId, int CardId);

    void removeAllTokensFromDeck(int deckId);

    List<MagicToken> getAllTokensByDeck(int deckId);

    public void updateCardIdThatTokensBelongTo(int oldId, int newId);
}
