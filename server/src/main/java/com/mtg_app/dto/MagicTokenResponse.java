/*
 * Resposne object for a token from scryfall
 * https://api.scryfall.com/cards/d36e3c0e-a759-4adc-aa2f-61b13c0f786d
 */

package com.mtg_app.dto;

import org.springframework.stereotype.Component;

@Component
public class MagicTokenResponse {

    private String id;
    private String name;
    private ImageUris image_uris;
    private String type_line;
    private String oracle_text;
    private int power;
    private int toughness;

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public ImageUris getImage_uris() {
        return image_uris;
    }

    public String getType_line() {
        return type_line;
    }

    public String getOracle_text() {
        return oracle_text;
    }

    public int getPower() {
        return power;
    }

    public int getToughness() {
        return toughness;
    }

    @Override
    public String toString() {
        return "MagicTokenRequest{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", image_uris=" + (image_uris != null ? image_uris : null) +
                ", type_line='" + type_line + '\'' +
                ", oracle_text='" + oracle_text + '\'' +
                ", power=" + power +
                ", toughness=" + toughness +
                '}';
    }

    // Image Uri object
    public static class ImageUris {
        private String large;

        public String getLarge() {
            return this.large;
        }

        @Override
        public String toString() {
            return "ImageUris{" +
                    "large='" + large + '\'' +
                    '}';
        }
    }
}
