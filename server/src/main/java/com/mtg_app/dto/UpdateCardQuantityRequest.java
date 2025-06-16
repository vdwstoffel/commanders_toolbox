package com.mtg_app.dto;

import org.springframework.stereotype.Component;

@Component
public class UpdateCardQuantityRequest {

    private int quantity;

    public UpdateCardQuantityRequest() {
        // empty constructor for bean
    }

    public UpdateCardQuantityRequest(int quantity) {
        this.quantity = quantity;
    }

    public int getQuantity() {
        return this.quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
