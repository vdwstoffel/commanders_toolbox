package com.mtg_app.dto;

import org.springframework.stereotype.Component;

@Component
public class DeckUpdateRequest {
    private String deckName;
    private String deckTheme;

    public DeckUpdateRequest() {
        // Empty constructor for spring bean
    }

    public DeckUpdateRequest(String deckName, String deckTheme) {
        this.deckName = deckName;
        this.deckTheme = deckTheme;
    }

    public String getDeckName() {
        return deckName;
    }

    public void setDeckName(String deckName) {
        this.deckName = deckName;
    }

    public String getDeckTheme() {
        return deckTheme;
    }

    public void setDeckTheme(String deckTheme) {
        this.deckTheme = deckTheme;
    }

    @Override
    public String toString() {
        return "DeckUpdateRequest{" +
                "deckName='" + deckName + '\'' +
                ", deckTheme='" + deckTheme + '\'' +
                '}';
    }

}
