package com.mtg_app.dto;

import org.springframework.stereotype.Component;

@Component
public class CardQuantityAndName {
    private int quantity;
    private String cardName;

    public CardQuantityAndName() {
    }

    public CardQuantityAndName(int quantity, String cardName) {
        this.quantity = quantity;
        this.cardName = cardName;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getCardName() {
        return cardName;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public void setCardName(String cardName) {
        this.cardName = cardName;
    }

    @Override
    public String toString() {
        return "CardQuantityAndName{" +
                "quantity=" + quantity +
                ", cardName='" + cardName + '\'' +
                '}';
    }
}
