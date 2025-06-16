package com.mtg_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table
public class MagicDeckCardToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int deckCardTokenId;
    private int deckId;
    private int cardId;
    private String tokenId;


    public MagicDeckCardToken() {};

    public MagicDeckCardToken(int deckId, int cardId, String tokenId) {
        this.deckId = deckId;
        this.cardId = cardId;
        this.tokenId = tokenId;
    }

    public int getDeckCardTokenId() {
        return deckCardTokenId;
    }

    public void setDeckCardTokenId(int deckCardTokenId) {
        this.deckCardTokenId = deckCardTokenId;
    }

    public int getDeckId() {
        return deckId;
    }

    public void setDeckId(int deckId) {
        this.deckId = deckId;
    }

    public int getCardId() {
        return cardId;
    }

    public void setCardId(int cardId) {
        this.cardId = cardId;
    }

    public String getTokenId() {
        return tokenId;
    }

    public void setTokenId(String tokenId) {
        this.tokenId = tokenId;
    }

    @Override
    public String toString() {
        return "MagicDeckCardToken{" +
                "deckCardTokenId=" + deckCardTokenId +
                ", deckId=" + deckId +
                ", cardId=" + cardId +
                ", tokenId='" + tokenId + '\'' +
                '}';
    }
}
