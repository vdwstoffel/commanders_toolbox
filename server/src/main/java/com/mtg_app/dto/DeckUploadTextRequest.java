package com.mtg_app.dto;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class DeckUploadTextRequest {
    private List<MagicCardRequest> cards;

    public DeckUploadTextRequest() {
    }

    public DeckUploadTextRequest(List<MagicCardRequest> cards) {
        this.cards = cards;
    }

    public List<MagicCardRequest> getCards() {
        return this.cards;
    }

    public void setCards(List<MagicCardRequest> cards) {
        this.cards = cards;
    }

    @Override
    public String toString() {
        return "DeckUploadTextRequest{" +
                "cards=" + cards +
                '}';
    }

}
