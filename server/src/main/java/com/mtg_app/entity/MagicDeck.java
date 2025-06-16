package com.mtg_app.entity;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table
public class MagicDeck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deck_id")
    private int deckId;

    private String userId;
    private String deckName;
    private String theme;
    private List<String> commander;
    private String colorIdentity;
    private List<String> deckImageUri;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MagicDeckCard> deckCard;


    public MagicDeck() {

    }

    public MagicDeck (String userId, String deckName, String theme, List<String> commander, String colorIdentity, List<String> deckImageUri) {
        this.userId = userId;
        this.deckName = deckName;
        this.theme = theme;
        this.commander = commander;
        this.colorIdentity = colorIdentity;
        this.deckImageUri = deckImageUri;
    }

    public int getDeckId() {
        return deckId;
    }

    public void setDeckId(int deckId) {
        this.deckId = deckId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDeckName() {
        return deckName;
    }

    public void setDeckName(String deckName) {
        this.deckName = deckName;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public List<String> getCommander() {
        return commander;
    }

    public void setCommander(List<String> commander) {
        this.commander = commander;
    }

    public String getColorIdentity() {
        return colorIdentity;
    }

    public void setColorIdentity(String colorIdentity) {
        this.colorIdentity = colorIdentity;
    }

    public List<String> getDeckImageUri() {
        return deckImageUri;
    }

    public void setDeckImageUri(List<String> deckImageUri) {
        this.deckImageUri = deckImageUri;
    }

    @Override
    public String toString() {
        return "MagicDeck{" +
                "deckId=" + deckId +
                ", userId='" + userId + '\'' +
                ", deckName='" + deckName + '\'' +
                ", theme='" + theme + '\'' +
                ", commander=" + commander +
                ", colorIdentity='" + colorIdentity + '\'' +
                ", deckImageUri=" + deckImageUri +
                '}';
    }

}
