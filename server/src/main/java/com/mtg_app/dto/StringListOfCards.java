package com.mtg_app.dto;

import java.util.List;

public class StringListOfCards {
    private List<String> cards;

    public List<String> getCards() {
        return this.cards;
    }

    public void setCards(List<String> cards) {
        this.cards = cards;
    }

    @Override
    public String toString() {
        return "StringListOfCards{" +
                "cards=" + this.cards +
                '}';
    }
}
