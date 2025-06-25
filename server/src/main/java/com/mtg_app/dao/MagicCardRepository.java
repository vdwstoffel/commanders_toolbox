package com.mtg_app.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mtg_app.entity.MagicCard;

public interface MagicCardRepository extends JpaRepository<MagicCard, Integer> {
    // basic crud operations extends from the JPA repository

    @Query("FROM MagicCard c WHERE c.cardName = :cardName")
    MagicCard getCardByName(@Param("cardName") String cardName);

    @Query("SELECT c.cardName FROM MagicCard c WHERE c.cardName in :cards")
    List<String> batchCheckIfCardsExist(@Param("cards") List<String> cards);

}
