package com.mtg_app.tools;

import org.springframework.web.client.RestTemplate;

import com.mtg_app.dto.MagicTokenResponse;

public class ScryfallApi {

    public MagicTokenResponse getTokenDetails(String tokenId) {
        String uri = "https://api.scryfall.com/cards/" + tokenId;
        RestTemplate restTemplate = new RestTemplate();
        MagicTokenResponse response = restTemplate.getForObject(uri, MagicTokenResponse.class);
        return response;
    }


}
