package com.mtg_app.tools;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.springframework.web.client.RestTemplate;

import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.MagicTokenResponse;

public class ScryfallApi {

    public MagicTokenResponse getTokenDetails(String tokenId) {
        String uri = "https://api.scryfall.com/cards/" + tokenId;
        RestTemplate restTemplate = new RestTemplate();
        MagicTokenResponse response = restTemplate.getForObject(uri, MagicTokenResponse.class);
        return response;
    }

    // https://scryfall.com/docs/api/cards/collection
    public List<MagicCardRequest> getCardCollections(List<String> cards) {

        RestTemplate restTemplate = new RestTemplate();
        String uri = "https://api.scryfall.com/cards/collection";

        List<HashMap<String, String>> cardBody = new ArrayList<>();
        HashMap<String, List<HashMap<String, String>>> body = new HashMap<>();

        // Add all the cards to the body
        for (String cardName : cards) {
            HashMap<String, String> card = new HashMap<>();
            card.put("name", cardName);
            cardBody.add(card);
        }

        // if the total amount is 75 or less send one batch
        if (cardBody.size() <= 75) {
            System.out.println(cardBody);
            body.put("identifiers", cardBody);
            ScryfallCollectionResponse cardResponse = restTemplate.postForObject(uri, body,
                    ScryfallCollectionResponse.class);
            return cardResponse.getCards();
        } else {
            body.put("identifiers", cardBody.subList(0, 75));
            ScryfallCollectionResponse batchOneResponse = restTemplate.postForObject(uri, body,
                    ScryfallCollectionResponse.class);

            body.clear();
            body.put("identifiers", cardBody.subList(76, cardBody.size()));
            ScryfallCollectionResponse batchTwoResponse = restTemplate.postForObject(uri, body,
                    ScryfallCollectionResponse.class);

            List<MagicCardRequest> batchOne = batchOneResponse.getCards();
            List<MagicCardRequest> batchTwo = batchTwoResponse.getCards();

            List<MagicCardRequest> merged = new ArrayList<>(batchOne);
            merged.addAll(batchTwo);
            return merged;

        }
    }

}

final class ScryfallCollectionResponse {
    private List<MagicCardRequest> cards;

    public List<MagicCardRequest> getCards() {
        return cards;
    }

    public void setData(List<MagicCardRequest> cards) {
        this.cards = cards;
    }

}
