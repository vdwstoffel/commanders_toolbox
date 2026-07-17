package com.mtg_app.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.mtg_app.dao.MagicCardRepository;
import com.mtg_app.dao.MagicDeckCardRepository;
import com.mtg_app.dao.MagicDeckRepository;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.entity.MagicDeck;
import com.mtg_app.entity.MagicDeckCard;

class MagicDeckCardServiceTest {

    private final MagicDeckCardRepository deckCardRepo = mock(MagicDeckCardRepository.class);
    private final MagicDeckRepository deckRepo = mock(MagicDeckRepository.class);
    private final MagicCardRepository cardRepo = mock(MagicCardRepository.class);
    private final MagicDeckCardService service = new MagicDeckCardService(deckCardRepo, deckRepo, cardRepo);

    private MagicCard card(int id, String name, String colorIdentity, String type) {
        return new MagicCard(id, name, colorIdentity, List.of(), 0, type, "normal", List.of(), "set");
    }

    @Test
    void removesStaleBasicLandsOfColoursNoLongerInTheDeckOnRerun() {
        // A mono-white deck (60 non-land cards) that still has 8 Islands left over
        // from a previous build. Re-running populate must drop the Islands and fill
        // the 40 open slots with Plains only.
        MagicDeck deck = new MagicDeck();
        deck.setDeckId(1);

        MagicDeckCard whiteCard = new MagicDeckCard(card(10, "Savannah Lions", "W", "creature"), deck, false, 60);
        MagicDeckCard staleIsland = new MagicDeckCard(card(20, "Island", "U", "land"), deck, false, 8);

        when(deckRepo.getDeckByDeckIdAndUserId(1, "user")).thenReturn(deck);
        when(deckCardRepo.getAllCardsByDeckId(1)).thenReturn(List.of(whiteCard, staleIsland));
        when(deckCardRepo.getBasicLandsInDeckByDeckId(1)).thenReturn(List.of(staleIsland));
        when(cardRepo.getCardByName("Plains")).thenReturn(card(30, "Plains", "W", "land"));

        service.autoFillRemainingDeckWithBasicLands(1, "user");

        // The stale Island must be removed, and never re-added
        verify(deckCardRepo).deleteCardFromDeck(1, 20);
        verify(cardRepo, never()).getCardByName("Island");

        // Plains fills exactly the 40 open slots
        verify(cardRepo).getCardByName("Plains");
        ArgumentCaptor<MagicDeckCard> saved = ArgumentCaptor.forClass(MagicDeckCard.class);
        verify(deckCardRepo).save(saved.capture());
        assertEquals(30, saved.getValue().getCard().getId());
        assertEquals(40, saved.getValue().getQuantity());
    }
}
