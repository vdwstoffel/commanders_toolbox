package com.mtg_app.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.MagicDeckCardTokenRepository;
import com.mtg_app.entity.MagicDeckCardToken;
import com.mtg_app.entity.MagicToken;

@Service
public class MagicDeckCardTokenService implements MagicDeckCardTokenServiceInterface {

    private MagicDeckCardTokenRepository magicDeckCardTokenRepository;

    @Autowired
    public MagicDeckCardTokenService(MagicDeckCardTokenRepository magicDeckCardTokenRepository) {
        this.magicDeckCardTokenRepository = magicDeckCardTokenRepository;
    }

    @Override
    public MagicDeckCardToken createDeckCardTokenMapping(MagicDeckCardToken tokenMapping) {
        return magicDeckCardTokenRepository.save(tokenMapping);
    }

    @Override
    public void removeTokensFromDeckByCard(int deckId, int cardId) {
        this.magicDeckCardTokenRepository.removeTokensFromDeckByCard(deckId, cardId);
    }

    @Override
    public void removeAllTokensFromDeck(int deckId) {
        this.magicDeckCardTokenRepository.removeAllTokensFromDeck(deckId);
    }

    @Override
    public List<MagicToken> getAllTokensByDeck(int deckId) {
        return this.magicDeckCardTokenRepository.getAllTokensByDeck(deckId);
    }

}
