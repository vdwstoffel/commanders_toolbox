package com.mtg_app.dto;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class DeckTextUploadRequest {
    private List<CardQuantityAndName> cardQuantityAndName;

    public DeckTextUploadRequest() {
    };

    public DeckTextUploadRequest(List<CardQuantityAndName> cardQuantityAndNames) {
        this.cardQuantityAndName = cardQuantityAndNames;
    };

    public List<CardQuantityAndName> getCardQuantityAndName() {
        return cardQuantityAndName;
    }

    public void setCardQuantityAndName(List<CardQuantityAndName> cardQuantityAndName) {
        this.cardQuantityAndName = cardQuantityAndName;
    }

    @Override
    public String toString() {
        return "DeckTextUploadRequest{" +
                "cardQuantityAndName=" + cardQuantityAndName +
                '}';
    }

}

