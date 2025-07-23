package com.mtg_app.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class StringListOfCards {
    private List<String> cards;

    public StringListOfCards() {
        this.cards = new ArrayList<>();
    }

    public StringListOfCards(List<String> cards) {
        this.cards = cards != null ? new ArrayList<>(cards) : new ArrayList<>();
    }

    public List<String> getCards() {
        return this.cards != null ? new ArrayList<>(this.cards) : new ArrayList<>();
    }

    public void setCards(List<String> cards) {
        this.cards = cards != null ? new ArrayList<>(cards) : new ArrayList<>();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        StringListOfCards that = (StringListOfCards) obj;
        return Objects.equals(cards, that.cards);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cards);
    }

    @Override
    public String toString() {
        return "StringListOfCards{" +
                "cards=" + this.cards +
                '}';
    }
}
