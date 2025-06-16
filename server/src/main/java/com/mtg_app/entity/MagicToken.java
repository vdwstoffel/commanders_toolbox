package com.mtg_app.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table
public class MagicToken {
    @Id
    // Use the token id instead of tcg id so when can check if the token exists before making api call
    private String magicTokenId; // token id ex: "d36e3c0e-a759-4adc-aa2f-61b13c0f786d"

    private String tokenName;
    private String tokenImageUri;
    private String typeLine;
    private String oracleText;
    private int power;
    private int toughness;

    public MagicToken() {

    }

    public MagicToken(String magicTokenId, String tokenName, String tokenImageUri, String typeLine, String oracleText,
            int power, int toughness) {
        this.magicTokenId = magicTokenId;
        this.tokenName = tokenName;
        this.tokenImageUri = tokenImageUri;
        this.typeLine = typeLine;
        this.oracleText = oracleText;
        this.power = power;
        this.toughness = toughness;
    }

    public String getMagicTokenId() {
        return magicTokenId;
    }

    public void setMagicTokenId(String magicTokenId) {
        this.magicTokenId = magicTokenId;
    }

    public String getTokenName() {
        return tokenName;
    }

    public void setTokenName(String tokenName) {
        this.tokenName = tokenName;
    }

    public String getTokenImageUri() {
        return tokenImageUri;
    }

    public void setTokenImageUri(String tokenUri) {
        this.tokenImageUri = tokenUri;
    }

    public String getTypeLine() {
        return typeLine;
    }

    public void setTypeLine(String typeLine) {
        this.typeLine = typeLine;
    }

    public String getOracleText() {
        return oracleText;
    }

    public void setOracleText(String oracleText) {
        this.oracleText = oracleText;
    }

    public int getPower() {
        return power;
    }

    public void setPower(int power) {
        this.power = power;
    }

    public int getToughness() {
        return toughness;
    }

    public void setToughness(int toughness) {
        this.toughness = toughness;
    }

    @Override
    public String toString() {
        return "MagicToken{" +
                "magicTokenId=" + magicTokenId +
                ", tokenName='" + tokenName + '\'' +
                ", tokenUri='" + tokenImageUri + '\'' +
                ", typeLine='" + typeLine + '\'' +
                ", oracleText='" + oracleText + '\'' +
                ", power=" + power +
                ", toughness=" + toughness +
                '}';
    }
}
