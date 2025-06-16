package com.mtg_app.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mtg_app.entity.MagicDeckCardToken;
import com.mtg_app.entity.MagicToken;

import jakarta.transaction.Transactional;

public interface MagicDeckCardTokenRepository extends JpaRepository<MagicDeckCardToken, Integer> {
    // basic crud implemented from jparepository

    @Query("SELECT t FROM MagicDeckCardToken m INNER JOIN MagicToken t ON m.tokenId = t.magicTokenId  WHERE m.deckId = :deckId")
    List<MagicToken> getAllTokensByDeck(@Param("deckId") int deckId);

    @Modifying
    @Transactional
    @Query("DELETE FROM MagicDeckCardToken m WHERE m.cardId = :cardId AND m.deckId = :deckId")
    void removeTokensFromDeckByCard(@Param("deckId") int deckId, @Param("cardId") int cardId);

    @Modifying
    @Transactional
    @Query("DELETE FROM MagicDeckCardToken d WHERE d.deckId = :deckId")
    void removeAllTokensFromDeck(@Param("deckId") int deckId);
}
