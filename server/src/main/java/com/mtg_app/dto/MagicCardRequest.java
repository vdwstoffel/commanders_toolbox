/*
 * This class is an entity for the api response from scryfall
 */

package com.mtg_app.dto;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class MagicCardRequest {
    private int tcgplayer_id;
    private String name;
    private String mana_cost;
    private List<String> color_identity;
    private int cmc;
    private String type_line;
    private String layout;
    private ImageUris image_uris;
    private List<CardFace> card_faces;
    private List<AllParts> all_parts;

    public MagicCardRequest() {
    };

    public MagicCardRequest(int tcgplayer_id, String name, String mana_cost, List<String> color_identity, int cmc,
            String type_line, String layout,
            ImageUris image_uris, List<CardFace> card_faces, List<AllParts> all_parts) {
        this.tcgplayer_id = tcgplayer_id;
        this.name = name;
        this.mana_cost = mana_cost;
        this.color_identity = color_identity;
        this.cmc = cmc;
        this.type_line = type_line;
        this.layout = layout;
        this.image_uris = image_uris;
        this.card_faces = card_faces;
        this.all_parts = all_parts;
    };

    public int getTcgplayer_id() {
        return tcgplayer_id;
    }

    public void setTcgplayer_id(int tcgplayer_id) {
        this.tcgplayer_id = tcgplayer_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMana_cost() {

        // If it is a double faced card only return the value for the front facing card
        if (this.mana_cost == null) {
            return this.card_faces.get(0).mana_cost + " // " + this.card_faces.get(1).mana_cost;
        }
        return mana_cost;

    }

    public void setMana_cost(String mana_cost) {
        this.mana_cost = mana_cost;
    }

    public List<String> getColor_identity() {
        return this.color_identity;
    }

    public void setColor_identity(List<String> color_identity) {
        this.color_identity = color_identity;
    }

    public int getCmc() {
        return cmc;
    }

    public void setCmc(int cmc) {
        this.cmc = cmc;
    }

    public String getType_line() {
        // If a card name has a // we know it is two cards and we only need the front
        // face
        if (this.type_line.contains("//")) {
            return this.card_faces.get(0).type_line;
        }
        return type_line;
    }

    public void setType_line(String type_line) {
        this.type_line = type_line;
    }

    public String getLayout() {
        return layout;
    }

    public void setLayout(String layout) {
        this.layout = layout;
    }

    public ImageUris getImage_uris() {
        if (this.image_uris == null) {
            return this.card_faces.get(0).image_uris;
        }
        return image_uris;
    }

    public void setImage_uris(ImageUris image_uris) {
        this.image_uris = image_uris;
    }

    public List<CardFace> getCard_faces() {
        return card_faces;
    }

    public void setCard_faces(List<CardFace> card_faces) {
        this.card_faces = card_faces;
    }

    /**
     * Function will check if the card is double sided or not and return teh correct
     * amount of image urls as an array
     * 
     * @return An array of card urls
     */
    public List<String> getCardImages() {
        List<String> uris = new ArrayList<>();

        if (this.image_uris == null) {
            uris.add(this.card_faces.get(0).image_uris.getLarge());
            uris.add(this.card_faces.get(1).image_uris.getLarge());
        } else {
            uris.add(image_uris.getLarge());
        }
        return uris;
    }

    public String getDeckImage() {
        if (this.image_uris == null) {
            return this.card_faces.get(0).image_uris.getArt_crop();
        }
        return image_uris.getArt_crop();
    }

    public List<AllParts> getAll_parts() {
        return this.all_parts;
    }

    public void setAll_parts(List<AllParts> all_parts) {
        this.all_parts = all_parts;
    }

    @Override
    public String toString() {
        return "MagicCardRequest{" +
                "tcgplayer_id=" + tcgplayer_id +
                ", name='" + name + '\'' +
                ", mana_cost='" + mana_cost + '\'' +
                ", color_identity=" + color_identity +
                ", cmc=" + cmc +
                ", type_line='" + type_line + '\'' +
                ", layout='" + layout + '\'' +
                ", image_uris=" + (image_uris != null ? image_uris.toString() : "null") +
                ", card_faces=" + (card_faces != null ? card_faces.toString() : "null") +
                ", all_parts=" + (all_parts != null ? all_parts.toString() : "null") +
                '}';
    }

    // Image Uri objects
    public static class ImageUris {
        private String small;
        private String normal;
        private String large;
        private String png;
        private String art_crop;
        private String borderCrop;

        public String getSmall() {
            return small;
        }

        public String getNormal() {
            return normal;
        }

        public String getLarge() {
            return large;
        }

        public String getPng() {
            return png;
        }

        public String getArt_crop() {
            return art_crop;
        }

        public String getBorderCrop() {
            return borderCrop;
        }
    }

    // Double faced cards, card faces
    public static class CardFace {
        private String name;
        private String mana_cost;
        private String type_line;
        private ImageUris image_uris;

        public String getName() {
            return name;
        }

        public String getMana_cost() {
            return mana_cost;
        }

        public String getType_line() {
            return type_line;
        }

        public ImageUris getImage_uris() {
            return image_uris;
        }
    }

    // Some cards have additional Parts, this can include double faced cards, partner with commanders and tokens
    public static class AllParts {
        private String id;
        private String type_line;
        private String uri;

        public String getId() {
            return this.id;
        }

        public String getType_line() {
            return this.type_line;
        }

        public String getUri() {
            return this.uri;
        }
    }

}
