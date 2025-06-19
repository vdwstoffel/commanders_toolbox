package com.mtg_app.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mtg_app.entity.MagicDeckCard;

import jakarta.transaction.Transactional;

public interface MagicDeckCardRepository extends JpaRepository<MagicDeckCard, Integer> {
    // crud inhereted from jpa

    @Query("FROM MagicDeckCard cd WHERE cd.deck.deckId = :deckId")
    List<MagicDeckCard> getAllCardsByDeckId(@Param("deckId") int deckId);

    @Query("FROM MagicDeckCard dc WHERE dc.card.cardId = :cardId AND dc.deck.deckId = :deckId")
    MagicDeckCard getCardEntryByDeckIdAndCardId(@Param("deckId") int deckId, @Param("cardId") int cardId);

    @Query("SELECT dc FROM MagicDeckCard dc INNER JOIN MagicCard c ON c.cardId = dc.card.cardId WHERE dc.deck.deckId = :deckId AND c.cardName IN ('Swamp', 'Forest', 'Mountain', 'Island', 'Plains')")
    List<MagicDeckCard> getBasicLandsInDeckByDeckId(@Param("deckId") int deckId);

    @Modifying
    @Transactional
    @Query("UPDATE MagicDeckCard mdc SET mdc.quantity = :quantity WHERE mdc.card.cardId = :cardId AND mdc.deck.deckId = :deckId")
    void updateCardQuantityByDeckIdAndCardId(@Param("deckId") int deckId, @Param("cardId") int cardId,
            @Param("quantity") int quantity);

    @Modifying
    @Transactional
    @Query("DELETE FROM MagicDeckCard mdc WHERE mdc.card.cardId = :cardId AND mdc.deck.deckId = :deckId")
    void deleteCardFromDeck(@Param("deckId") int deckId, @Param("cardId") int cardId);

    @Modifying
    @Transactional
    @Query("DELETE FROM MagicDeckCard mdc WHERE mdc.deck.deckId = :deckId")
    void removeAllCardsFromDeck(@Param("deckId") int deckId);

    @Modifying
    @Transactional
    @Query("UPDATE MagicDeckCard mdc SET mdc.card.cardId = :newId WHERE mdc.card.cardId = :oldId")
    void updateCardPrinting(@Param("oldId") int OldId, @Param("newId") int newId);
}
