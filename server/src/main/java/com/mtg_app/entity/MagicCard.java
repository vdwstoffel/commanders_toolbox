package com.mtg_app.entity;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table
public class MagicCard {

    @Id
    @Column(name = "card_id")
    private int cardId; // tcg_player_id

    private String cardName;
    private String colorIdentity;
    private List<String> manaSymbolUris;
    private int cmc;
    private String cardType;
    private String layout; // TODO: Make this an enum
    private List<String> cardImageUrl;

    public MagicCard() {
    };

    public MagicCard(int cardId, String cardName, String colorIdentity, List<String> manaSymbolUris, int cmc,
            String cardType, String layout, List<String> cardImageUrl) {
        this.cardId = cardId;
        this.cardName = cardName;
        this.colorIdentity = colorIdentity;
        this.manaSymbolUris = manaSymbolUris;
        this.cmc = cmc;
        this.cardType = cardType;
        this.layout = layout;
        this.cardImageUrl = cardImageUrl;
    }

    public int getId() {
        return cardId;
    }

    public void setId(int cardId) {
        this.cardId = cardId;
    }

    public String getCardName() {
        return cardName;
    }

    public void setCardName(String cardName) {
        this.cardName = cardName;
    }

    public String getColorIdentity() {
        return colorIdentity;
    }

    public void setColorIdentity(String colorIdentity) {
        this.colorIdentity = colorIdentity;
    }

    public List<String> getManaSymbolUris() {
        return manaSymbolUris;
    }

    public void setManaSymbolUris(List<String> manaSymbolUris) {
        this.manaSymbolUris = manaSymbolUris;
    }

    public int getCmc() {
        return cmc;
    }

    public void setCmc(int cmc) {
        this.cmc = cmc;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public String getLayout() {
        return layout;
    }

    public void setLayout(String layout) {
        this.layout = layout;
    }

    public List<String> getCardImageUrl() {
        return cardImageUrl;
    }

    public void setCardImageUrl(List<String> cardImageUrl) {
        this.cardImageUrl = cardImageUrl;
    }

    @Override
    public String toString() {
        return "MagicCard{" +
                "id=" + cardId +
                ", cardName='" + cardName + '\'' +
                ", colorIdentity='" + colorIdentity + '\'' +
                ", manaSymbolUris=" + manaSymbolUris +
                ", cmc=" + cmc +
                ", cardType='" + cardType + '\'' +
                ", layout='" + layout + '\'' +
                ", cardImageUrl='" + cardImageUrl.toString() + '\'' +
                '}';
    }
}
