/**
 * Tools to help format parse and format magic card details
 */

package com.mtg_app.tools;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.client.RestTemplate;

import com.mtg_app.dto.ColorDistributionResponse;
import com.mtg_app.entity.MagicDeckCard;

public class MagicCardParser {

    /**
     * Function that takes a color Identity array and covert it to one string
     * 
     * @param colorIdentity
     * @return The string version of the color identity array
     */
    public String getColorIdentity(List<String> colorIdentity) {
        String finalIdentity = "";

        for (String color : colorIdentity) {
            finalIdentity += color;
        }

        return finalIdentity;
    }

    public String getUniqueColorsInIdentity(String colorIdentity) {

        String uniqueIdentity = "";

        for (int i = 0; i < colorIdentity.length(); i++) {
            int index = uniqueIdentity.indexOf(i);

            if (index == -1) {
                uniqueIdentity += colorIdentity.charAt(i);
            }
        }

        char[] sortedIdentity = uniqueIdentity.toCharArray();
        Arrays.sort(sortedIdentity);
        return new String(sortedIdentity);
    }

    public List<String> getManaSymbolUris(String manaCost) {
        String uri = "https://api.scryfall.com/symbology";
        RestTemplate restTemplate = new RestTemplate();

        ManaSymbolResponse response = restTemplate.getForObject(uri, ManaSymbolResponse.class);
        List<ManaSymbolData> manaSymbols = response.getData();
        String formattedManaSymbols = manaCost.replaceAll("}", "} ");
        String[] splitSymbols = formattedManaSymbols.split(" ");

        List<String> manaSymbolUris = new ArrayList<>();
        for (String card : splitSymbols) {

            // Iterate through each manaSymbol from scryfall and check if they match
            for (ManaSymbolData symbol : manaSymbols) {
                if (card.equals("//")) {
                    manaSymbolUris.add("//");
                    break;
                }

                if (card.trim().equals(symbol.getSymbol())) {
                    manaSymbolUris.add(symbol.getSvg_uri());
                    break;
                }
            }
        }

        return manaSymbolUris;
    }

    /**
     * Formats the Card type line to its most basic form ex Legendary Creature —
     * Demon => creature
     * 
     * @param typeLine String with full type ex legendary planswalker - Ajani
     * @return A string with a simplified type ex plansewalker
     */
    public String formattedType(String typeLine) {

        // Only care about the front facing card
        String[] types = typeLine.split("//");
        String frontFace = types[0].toLowerCase();
        String finalType = "";

        if (frontFace.contains("creature"))
            finalType = "creature";
        else if (frontFace.contains("artifact"))
            finalType = "artifact";
        else if (frontFace.contains("enchantment"))
            finalType = "enchantment";
        else if (frontFace.contains("planeswalker"))
            finalType = "planeswalker";
        else if (frontFace.contains("sorcery"))
            finalType = "sorcery";
        else if (frontFace.contains("instant"))
            finalType = "instant";
        else if (frontFace.contains("land"))
            finalType = "land";
        else if (frontFace.contains("battle"))
            finalType = "battle";
        return finalType;
    }

    /**
     * Goes through the deck and count the number of times a mana symbol appears in
     * teh color identity.
     * NOTE: it does not count the mana symbols in the mana cost but just the
     * colorIdentity (Ex A card with RRR will count as 1 red)
     * 
     * @param deckList
     * @return
     */
    public Map<String, Integer> getManaSymbolCountInDeck(List<MagicDeckCard> deckList) {

        int white = 0;
        int blue = 0;
        int black = 0;
        int red = 0;
        int green = 0;

        for (MagicDeckCard card : deckList) {
            // Exclude lands from the check
            if (card.getCard().getCardType().toLowerCase().equals("land"))
                continue;

            String colorIdentity = card.getCard().getColorIdentity();
            char[] identityArray = colorIdentity.toCharArray();

            for (char symbolColor : identityArray) {
                if (symbolColor == 'W')
                    white += 1;
                if (symbolColor == 'U')
                    blue += 1;
                if (symbolColor == 'B')
                    black += 1;
                if (symbolColor == 'R')
                    red += 1;
                if (symbolColor == 'G')
                    green += 1;
            }
        }

        Map<String, Integer> colorTotalMapping = new HashMap<>();
        colorTotalMapping.put("white", white);
        colorTotalMapping.put("blue", blue);
        colorTotalMapping.put("black", black);
        colorTotalMapping.put("red", red);
        colorTotalMapping.put("green", green);

        return colorTotalMapping;
    }

    /**
     * Takes a decklist as a input and counts the color identity for each card.
     * Return the percentage of each color found
     * NOTE: it does not count the mana symbols in the mana cost but just the
     * colorIdentity (Ex A card with 3RRR will count as 1 red)
     * 
     * @param deckList
     * @return ColorDistributionResponse map with the color and the percentage
     */
    public ColorDistributionResponse colorDistribution(List<MagicDeckCard> deckList) {

        Map<String, Integer> totalManaSymbolsMapping = this.getManaSymbolCountInDeck(deckList);

        int white = totalManaSymbolsMapping.get("white");
        int blue = totalManaSymbolsMapping.get("blue");
        int black = totalManaSymbolsMapping.get("black");
        int red = totalManaSymbolsMapping.get("red");
        int green = totalManaSymbolsMapping.get("green");

        // get the percentage of each symbol symbolColorCount / total * 100
        int totalSymbols = white + blue + black + red + green;
        double whitePercentage = Math.round((((double) white / totalSymbols) * 100) * 10.0) / 10.0;
        double bluePercentage = Math.round((((double) blue / totalSymbols) * 100) * 10.0) / 10.0;
        double blackPercentage = Math.round((((double) black / totalSymbols) * 100) * 10.0) / 10.0;
        double redPercentage = Math.round((((double) red / totalSymbols) * 100) * 10.0) / 10.0;
        double greenPercentage = Math.round((((double) green / totalSymbols) * 100) * 10.0) / 10.0;

        // create the dto and return it
        ColorDistributionResponse response = new ColorDistributionResponse(whitePercentage, bluePercentage,
                blackPercentage, redPercentage, greenPercentage);
        return response;
    }

    /**
     * Distributes a fixed number of land slots across colors proportional to the
     * given percentages, using the largest-remainder method so the counts always
     * sum exactly to {@code totalSlots} (when at least one color is present). This
     * avoids the drift you get from rounding each color independently.
     *
     * @param percentages ordered map of land name -> color percentage (need not
     *                    sum to exactly 100)
     * @param totalSlots  number of land slots to fill; 0 or negative yields all
     *                    zeros
     * @return ordered map of land name -> integer count, summing to
     *         {@code max(totalSlots, 0)}
     */
    public Map<String, Integer> distributeLands(Map<String, Double> percentages, int totalSlots) {
        Map<String, Integer> result = new LinkedHashMap<>();
        double totalPercentage = percentages.values().stream().mapToDouble(Double::doubleValue).sum();

        // Nothing to fill, or a colorless deck: no basic lands
        if (totalSlots <= 0 || totalPercentage <= 0) {
            for (String name : percentages.keySet()) {
                result.put(name, 0);
            }
            return result;
        }

        // Give each color its floored share, remembering the fractional remainder
        Map<String, Double> remainders = new LinkedHashMap<>();
        int assigned = 0;
        for (Map.Entry<String, Double> entry : percentages.entrySet()) {
            double exact = (entry.getValue() / totalPercentage) * totalSlots;
            int base = (int) Math.floor(exact);
            result.put(entry.getKey(), base);
            remainders.put(entry.getKey(), exact - base);
            assigned += base;
        }

        // Hand the leftover slots to the present colors with the largest remainders
        List<String> byLargestRemainder = remainders.entrySet().stream()
                .filter(entry -> percentages.get(entry.getKey()) > 0)
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        int leftover = totalSlots - assigned;
        int i = 0;
        while (leftover > 0 && !byLargestRemainder.isEmpty()) {
            String name = byLargestRemainder.get(i % byLargestRemainder.size());
            result.put(name, result.get(name) + 1);
            leftover--;
            i++;
        }
        return result;
    }

    /*
     * Response object from scryfall
     */
    private static class ManaSymbolResponse {
        private List<ManaSymbolData> data;

        public List<ManaSymbolData> getData() {
            return this.data;
        }
    }

    /*
     * Shape of a single mana symbol object
     */
    private static class ManaSymbolData {
        private String symbol;
        private String svg_uri;

        public String getSymbol() {
            return this.symbol;
        }

        public String getSvg_uri() {
            return this.svg_uri;
        }
    }

}
