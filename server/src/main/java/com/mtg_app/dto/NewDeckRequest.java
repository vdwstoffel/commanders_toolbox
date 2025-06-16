package com.mtg_app.dto;

import java.util.List;

import org.springframework.stereotype.Component;



@Component
public class NewDeckRequest {
    private String deckName;
    private List<MagicCardRequest> deckData;
    private String theme;

    public NewDeckRequest() {
    };

    public NewDeckRequest(String deckName, List<MagicCardRequest> deckData, String theme) {
        this.deckName = deckName;
        this.deckData = deckData;
        this.theme = theme;

    }

    public String getDeckName() {
        return deckName;
    }

    public void setDeckName(String deckName) {
        this.deckName = deckName;
    }

    public List<MagicCardRequest> getDeckData() {
        return deckData;
    }

    public void setDeckData(List<MagicCardRequest> deckData) {
        this.deckData = deckData;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    @Override
    public String toString() {
        return "NewDeckRequest{" +
                "deckName='" + deckName + '\'' +
                ", deckData=" + deckData +
                ", theme='" + theme + '\'' +
                '}';
    }
}
