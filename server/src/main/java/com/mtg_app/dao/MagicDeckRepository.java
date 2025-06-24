package com.mtg_app.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mtg_app.entity.MagicDeck;

import jakarta.transaction.Transactional;

public interface MagicDeckRepository extends JpaRepository<MagicDeck, Integer> {
    // basic crud operation extends from the JPA Repository

    
    @Query("FROM MagicDeck md WHERE md.userId = :userId ORDER BY md.deckName ASC")
    List<MagicDeck> getAllDecksByUserId(@Param("userId") String userId);

    /**
     * Function to ensure that the user has the correct rights to access the deck, if the deck Id and the userId does not match return null
     */
    @Query("FROM MagicDeck md WHERE md.deckId = :deckId AND md.userId = :userId")
    MagicDeck getDeckByDeckIdAndUserId(@Param("deckId") int deckId, @Param("userId") String userId);


    /*
     * User both the deckId and user Id to ensure the deck belongs to the user
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM MagicDeck md WHERE md.deckId = :deckId AND md.userId = :userId")
    void deleteDeckByDeckIdAndUserId(@Param("deckId") int deckId, @Param("userId") String userId);
}
