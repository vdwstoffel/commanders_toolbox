package com.mtg_app.tools;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.mtg_app.entity.MagicDeckCard;

public class FileService {
    public File createDefaultDeckList(List<MagicDeckCard> deckList) throws IOException {
        File file = new File("./deckTest.txt");

        String deckString = "Commander\n";

        List<CardQuantity> commanders = new ArrayList<>();
        List<CardQuantity> creatures = new ArrayList<>();
        List<CardQuantity> artifacts = new ArrayList<>();
        List<CardQuantity> enchantments = new ArrayList<>();
        List<CardQuantity> battles = new ArrayList<>();
        List<CardQuantity> planeswalkers = new ArrayList<>();
        List<CardQuantity> instants = new ArrayList<>();
        List<CardQuantity> sorceries = new ArrayList<>();
        List<CardQuantity> lands = new ArrayList<>();

        for (MagicDeckCard cardEntry : deckList) {
            if (cardEntry.isCommander()) {
                commanders.add(new CardQuantity(1, cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("creature")) {
                creatures.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("artifact")) {
                artifacts.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("enchantment")) {
                enchantments.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("battle")) {
                battles.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("planeswalker")) {
                planeswalkers.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("instant")) {
                instants.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("sorcery")) {
                sorceries.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            } else if (cardEntry.getCard().getCardType().toLowerCase().equals("land")) {
                lands.add(new CardQuantity(cardEntry.getQuantity(), cardEntry.getCard().getCardName()));
            }
        }

        // Go through each list and add the card to the stringfile
        for (CardQuantity card : commanders) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nCreatures\n";
        for (CardQuantity card : creatures) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nArtifacts\n";
        for (CardQuantity card : artifacts) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nEnchantments\n";
        for (CardQuantity card : enchantments) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nBattles\n";
        for (CardQuantity card : battles) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nPlaneswalkers\n";
        for (CardQuantity card : planeswalkers) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nInstants\n";
        for (CardQuantity card : instants) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nSorceries\n";
        for (CardQuantity card : sorceries) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        deckString += "\nLands\n";
        for (CardQuantity card : lands) {
            deckString += String.format("%s %s\n", card.getQuantity(), card.getCardName());
        }

        try (FileWriter writer = new FileWriter(file)) {
            writer.write(deckString);
        }

        return file;
    }

    /**
     * Parses the content of an uploaded deck list and extracts card names with
     * their quantities.
     * <p>
     * The input string is expected to contain one card per line, with each line
     * starting with the quantity
     * followed by the card name (e.g., "4 Lightning Bolt"). Section headers such as
     * "Commander", "Creatures",
     * and empty lines are ignored.
     * </p>
     *
     * @param fileContent the raw content of the uploaded deck list file as a single
     *                    string
     * @return a HashMap where the key is the card name and the value is the
     *         quantity of that card in the deck
     * @throws NumberFormatException          if a line does not start with a valid
     *                                        integer quantity
     * @throws ArrayIndexOutOfBoundsException if a line does not contain both
     *                                        quantity and card name
     */
    public Map<String, Integer> parseUploadedDeckList(String fileContent) {
        String[] splitByNewLine = fileContent.split("\n");
        Set<String> linesToSkip = Set.of("Commander", "Creatures", "Lands", "Sorceries", "Instants", "Planeswalkers",
                "Battles", "Artifacts", "Enchantments", "");
        Map<String, Integer> quantityAndCard = new HashMap<>();

        for (String line : splitByNewLine) {

            // Check the the first piece of the line is a digit
            if (linesToSkip.contains(line.trim())) {
                continue;
            }
            String[] qtyAndName = line.split("\\s", 2);
            String frontCardName = qtyAndName[1].split("//")[0].trim();
            quantityAndCard.put(frontCardName, Integer.parseInt(qtyAndName[0].trim()));
        }

        System.out.println(quantityAndCard);
        return quantityAndCard;
    }
}

// Object to handle the card Quantity and card Mapping
final class CardQuantity {
    private int quantity;
    private String cardName;

    public CardQuantity(int quantity, String cardName) {
        this.quantity = quantity;
        this.cardName = cardName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getCardName() {
        return cardName;
    }

    public void setCardName(String cardName) {
        this.cardName = cardName;
    }
}
