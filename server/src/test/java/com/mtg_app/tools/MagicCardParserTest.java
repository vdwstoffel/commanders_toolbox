package com.mtg_app.tools;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

class MagicCardParserTest {

    private final MagicCardParser parser = new MagicCardParser();

    private Map<String, Double> percentages(double plains, double island, double swamp, double mountain,
            double forest) {
        Map<String, Double> p = new LinkedHashMap<>();
        p.put("Plains", plains);
        p.put("Island", island);
        p.put("Swamp", swamp);
        p.put("Mountain", mountain);
        p.put("Forest", forest);
        return p;
    }

    private int sum(Map<String, Integer> counts) {
        return counts.values().stream().mapToInt(Integer::intValue).sum();
    }

    @Test
    void distributesEveryOpenSlotForAnEvenThreeColourSplit() {
        // 33.3 each does not divide 31 evenly - the remainder must still be handed out
        Map<String, Integer> result = parser.distributeLands(percentages(33.3, 33.3, 0, 0, 33.3), 31);
        assertEquals(31, sum(result), "every open slot must be filled");
    }

    @Test
    void distributesProportionallyForMonoColour() {
        Map<String, Integer> result = parser.distributeLands(percentages(100, 0, 0, 0, 0), 40);
        assertEquals(40, result.get("Plains"));
        assertEquals(0, result.get("Island"));
        assertEquals(40, sum(result));
    }

    @Test
    void neverAssignsLandsToAColourWithZeroPercent() {
        Map<String, Integer> result = parser.distributeLands(percentages(50, 0, 0, 0, 0), 7);
        assertEquals(0, result.get("Island"));
        assertEquals(0, result.get("Swamp"));
        assertEquals(7, result.get("Plains"));
    }

    @Test
    void returnsAllZerosForAColourlessDeck() {
        Map<String, Integer> result = parser.distributeLands(percentages(0, 0, 0, 0, 0), 40);
        assertEquals(0, sum(result));
    }

    @Test
    void returnsAllZerosWhenNoSlotsAreAvailable() {
        Map<String, Integer> result = parser.distributeLands(percentages(50, 50, 0, 0, 0), 0);
        assertEquals(0, sum(result));
    }
}
