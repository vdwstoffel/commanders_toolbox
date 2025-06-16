/*
 * Intermediate Table to map a card to a deck
 */

package com.mtg_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table
public class MagicDeckCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "card_id")
    private MagicCard card;

    @ManyToOne
    @JoinColumn(name = "deck_id")
    private MagicDeck deck;

    private boolean isCommander;
    private int quantity;

    public MagicDeckCard() {

    }

    public MagicDeckCard(MagicCard card, MagicDeck deck, boolean isCommander, int quantity) {
        this.card = card;
        this.deck = deck;
        this.isCommander = isCommander;
        this.quantity = quantity;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public MagicCard getCard() {
        return card;
    }

    public void setCard(MagicCard card) {
        this.card = card;
    }

    public MagicDeck getDeck() {
        return deck;
    }

    public void setDeck(MagicDeck deck) {
        this.deck = deck;
    }

    public boolean isCommander() {
        return isCommander;
    }

    public void setCommander(boolean isCommander) {
        this.isCommander = isCommander;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    @Override
    public String toString() {
        return "DeckCard{" +
                "id=" + id +
                ", card=" + (card != null ? card.getId() : null) +
                ", deck=" + (deck != null ? deck.getDeckId() : null) +
                ", isCommander=" + isCommander +
                ", quantity=" + quantity +
                '}';
    }

}