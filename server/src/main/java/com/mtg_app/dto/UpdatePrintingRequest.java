package com.mtg_app.dto;

import org.springframework.stereotype.Component;

@Component
public class UpdatePrintingRequest {
    private int originalId;
    private MagicCardRequest newCard;

    public UpdatePrintingRequest() {

    }

    public UpdatePrintingRequest(int originalId, MagicCardRequest newCard) {
        this.originalId = originalId;
        this.newCard = newCard;
    }

    public int getOriginalId() {
        return this.originalId;
    }

    public void setOriginalId(int originalId) {
        this.originalId = originalId;
    }

    public MagicCardRequest getNewCard() {
        return this.newCard;
    }

    public void setNewCard(MagicCardRequest newCard) {
        this.newCard = newCard;
    }

}
