package com.mtg_app.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class MagicTokenResponseTest {

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Tokens such as the Zombie produced by "Geralf, Visionary Stitcher" have a
     * variable power/toughness that Scryfall returns as the string "*". These
     * must deserialize without error, otherwise adding the producing card fails
     * with an HTTP 400.
     */
    @Test
    void deserializesVariablePowerAndToughness() {
        String json = """
                {
                  "id": "539f4b60-667b-469d-9191-eacaad5c0db1",
                  "name": "Zombie",
                  "type_line": "Token Creature — Zombie",
                  "oracle_text": "",
                  "power": "*",
                  "toughness": "*",
                  "image_uris": { "large": "https://example.com/zombie.jpg" }
                }
                """;

        MagicTokenResponse token = assertDoesNotThrow(() -> mapper.readValue(json, MagicTokenResponse.class));

        assertEquals("*", token.getPower());
        assertEquals("*", token.getToughness());
    }

    @Test
    void deserializesNumericPowerAndToughness() {
        String json = """
                {
                  "id": "abc",
                  "name": "Soldier",
                  "type_line": "Token Creature — Soldier",
                  "oracle_text": "",
                  "power": "1",
                  "toughness": "1",
                  "image_uris": { "large": "https://example.com/soldier.jpg" }
                }
                """;

        MagicTokenResponse token = assertDoesNotThrow(() -> mapper.readValue(json, MagicTokenResponse.class));

        assertEquals("1", token.getPower());
        assertEquals("1", token.getToughness());
    }
}
