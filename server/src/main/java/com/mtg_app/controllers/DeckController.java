package com.mtg_app.controllers;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpHeaders;

import com.mtg_app.dto.ColorDistributionResponse;
import com.mtg_app.dto.DeckUpdateRequest;
import com.mtg_app.dto.DeckUploadTextRequest;
import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.dto.NewDeckRequest;
import com.mtg_app.dto.UpdateCardQuantityRequest;
import com.mtg_app.dto.UpdatePrintingRequest;
import com.mtg_app.dto.MagicCardRequest.AllParts;
import com.mtg_app.entity.MagicCard;
import com.mtg_app.entity.MagicDeckCard;
import com.mtg_app.entity.MagicDeck;
import com.mtg_app.entity.MagicDeckCardToken;
import com.mtg_app.entity.MagicToken;
import com.mtg_app.service.MagicDeckCardService;
import com.mtg_app.service.MagicCardService;
import com.mtg_app.service.MagicDeckCardTokenService;
import com.mtg_app.service.MagicDeckService;
import com.mtg_app.tools.FileService;

@RestController
@RequestMapping("/api/v1/decks")
public class DeckController {

    private MagicDeckService magicDeckService;
    private MagicCardService magicCardService;
    private MagicDeckCardService magicDeckCardService;
    private MagicDeckCardTokenService magicDeckCardTokenService;

    @Autowired
    public DeckController(MagicCardService magicCardService, MagicDeckService magicDeckService,
            MagicDeckCardService magicDeckCardService, MagicDeckCardTokenService magicDeckCardTokenService) {
        this.magicCardService = magicCardService;
        this.magicDeckService = magicDeckService;
        this.magicDeckCardService = magicDeckCardService;
        this.magicDeckCardTokenService = magicDeckCardTokenService;
    };

    @GetMapping
    public ResponseEntity<List<MagicDeck>> getAllDecksByUserId(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<MagicDeck> userDecks = magicDeckService.getAllDecksByUserId(userId);
        return ResponseEntity.ok(userDecks);
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<List<MagicDeckCard>> getDeckById(@PathVariable int deckId) {
        List<MagicDeckCard> cardsInDeck = magicDeckCardService.getAllCardByDeckId(deckId);
        return ResponseEntity.ok(cardsInDeck);
    }

    @PutMapping("/{deckId}")
    public ResponseEntity<MagicDeck> updateDeckById(@AuthenticationPrincipal Jwt jwt, @PathVariable int deckId,
            @RequestBody DeckUpdateRequest deckUpdate) {
        String userId = jwt.getSubject();
        String deckName = deckUpdate.getDeckName();
        String deckTheme = deckUpdate.getDeckTheme();

        MagicDeck deckToUpdate = magicDeckService.getDeckByDeckIdAndUserId(deckId, userId);

        if (deckToUpdate == null)
            throw new RuntimeException("No Deck found");

        if (deckName != null)
            deckToUpdate.setDeckName(deckName);
        if (deckTheme != null)
            deckToUpdate.setTheme(deckTheme);

        MagicDeck savedDeck = this.magicDeckService.updateDeck(deckToUpdate);
        return ResponseEntity.ok(savedDeck);
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<String> deleteDeck(@AuthenticationPrincipal Jwt jwt, @PathVariable int deckId) {

        String userId = jwt.getSubject();

        // First query the deck to ensure the user owns that deck
        MagicDeck owner = this.magicDeckService.getDeckByDeckIdAndUserId(deckId, userId);
        if (owner == null) {
            return ResponseEntity.badRequest().body("Deck not found");
        }

        // Remove all the tokens from the deck
        this.magicDeckCardTokenService.removeAllTokensFromDeck(deckId);
        // Remove all cards from the deck
        this.magicDeckCardService.removeAllCardsFromDeck(deckId);
        // delete deck
        this.magicDeckService.deleteDeck(deckId, userId);

        return ResponseEntity.ok("Deck with id " + deckId + " deleted");
    }

    @GetMapping("/{deckId}/tokens")
    public ResponseEntity<List<MagicToken>> getAllTokensByDeck(@PathVariable int deckId) {
        List<MagicToken> tokens = this.magicDeckCardTokenService.getAllTokensByDeck(deckId);
        return ResponseEntity.ok(tokens);
    }

    @PostMapping
    public ResponseEntity<MagicDeck> createNewDeck(@AuthenticationPrincipal Jwt jwt,
            @RequestBody NewDeckRequest newDeckRequest) {

        String userId = jwt.getSubject();
        List<MagicCardRequest> cards = newDeckRequest.getDeckData();

        // Save the card to an array so that it can be added to the deck card mapping
        List<MagicCard> cardToAddToMapping = new ArrayList<>();
        // TokenId, DeckId
        Map<String, Integer> tokensToAddToDeck = new HashMap<>();

        for (MagicCardRequest card : cards) {
            MagicCard newCard = this.magicCardService.getOrCreateNewCard(card);
            cardToAddToMapping.add(newCard);

            // The getOrCreate Card creates the token so it does exists at this point
            if (card.getAll_parts() != null) {
                List<AllParts> tokens = card.getAll_parts();
                for (AllParts token : tokens) {
                    if (token.getType_line().contains("Token")) {
                        tokensToAddToDeck.put(token.getId(), newCard.getId());
                    }
                }
            }
        }

        MagicDeck savedDeck = this.magicDeckService.createDeck(newDeckRequest, userId);

        // Create a deck card mapping
        for (MagicCard card : cardToAddToMapping) {
            this.magicDeckCardService.createOrUpdateDeckCardMapping(card, savedDeck, true, 1);
        }

        // Add the card id and the token id to the deck id
        if (tokensToAddToDeck.size() > 0) {
            for (Map.Entry<String, Integer> entry : tokensToAddToDeck.entrySet()) {
                MagicDeckCardToken tokenMappingToCreate = new MagicDeckCardToken(savedDeck.getDeckId(),
                        entry.getValue(),
                        entry.getKey());
                magicDeckCardTokenService.createDeckCardTokenMapping(tokenMappingToCreate);
            }
        }

        return ResponseEntity.ok(savedDeck);
    }

    @PostMapping("/{deckId}/add-card")
    public ResponseEntity<String> addCardToDeck(@AuthenticationPrincipal Jwt jwt, @PathVariable int deckId,
            @RequestBody MagicCardRequest cardRequest) {

        String userId = jwt.getSubject();

        // Find deck by userId and deckID, if it does not exists throw an error
        MagicDeck deck = magicDeckService.getDeckByDeckIdAndUserId(deckId, userId);
        if (deck == null)
            throw new RuntimeException("No Deck found");

        this.magicDeckService.addCardToDeck(deck, cardRequest);
        return ResponseEntity.ok("Card added to deck");
    }

    @PatchMapping("/{deckId}/{cardId}")
    public void updateCardQuantity(@PathVariable int deckId, @PathVariable int cardId,
            @RequestBody UpdateCardQuantityRequest quantityRequest) {
        magicDeckCardService.updateCardQuantity(deckId, cardId, quantityRequest.getQuantity());

    }

    @DeleteMapping("/{deckId}/{cardId}")
    public ResponseEntity<String> removeCardFromDeck(@PathVariable int deckId, @PathVariable int cardId) {
        this.magicDeckCardService.removeCardFromDeck(deckId, cardId);
        this.magicDeckCardTokenService.removeTokensFromDeckByCard(deckId, cardId);
        return ResponseEntity.ok(cardId + " removed from deck " + deckId);
    }

    @GetMapping("/stats/{deckId}/color-distribution")
    public ResponseEntity<ColorDistributionResponse> getColorDistribution(@AuthenticationPrincipal Jwt jwt,
            @PathVariable int deckId) {
        String userId = jwt.getSubject();
        ColorDistributionResponse stat = this.magicDeckService.colorDistribution(deckId, userId);
        return ResponseEntity.ok(stat);
    }

    @PutMapping("/{deckId}/populate-lands")
    public ResponseEntity<String> autoPopulateDeckWithBasicLands(@AuthenticationPrincipal Jwt jwt,
            @PathVariable int deckId) {
        String userId = jwt.getSubject();
        this.magicDeckCardService.autoFillRemainingDeckWithBasicLands(deckId, userId);

        return ResponseEntity.ok("Basic decks updated");
    }

    @PutMapping("/{deckId}/update-printing")
    public ResponseEntity<String> updateCardPrinting(@PathVariable int deckId,
            @RequestBody UpdatePrintingRequest printingRequest, @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();
        int originalId = printingRequest.getOriginalId();
        int newCardId = printingRequest.getNewCard().getTcgplayer_id();

        // Check if the card with the new Id already exists in the database, if not
        // create it
        Optional<MagicCard> exists = this.magicCardService.getCardById(newCardId);
        if (!exists.isPresent()) {
            MagicCardRequest newCard = printingRequest.getNewCard();
            this.magicCardService.getOrCreateNewCard(newCard);
        }

        // Check if the card is the commander, if yes update the image in the deck
        // entity
        MagicDeck deck = this.magicDeckService.getDeckByDeckIdAndUserId(deckId, userId);
        List<String> commanders = deck.getCommander();
        List<String> deckImages = deck.getDeckImageUri();

        if (commanders.contains(printingRequest.getNewCard().getName())) {
            // Get the index of the commander and change the image at that index, this will
            // correctly update dual commanders
            int commanderIndex = commanders.indexOf(printingRequest.getNewCard().getName());
            deckImages.set(commanderIndex, printingRequest.getNewCard().getDeckImage());
            deck.setDeckImageUri(deckImages);
            this.magicDeckService.updateDeck(deck);
        }

        // Update the card in the DeckCardMapping
        this.magicDeckCardService.updateCardPrinting(originalId, newCardId);

        // Check if the card has any tokens and update the value in the
        // deckCardTokenMapping
        this.magicDeckCardTokenService.updateCardIdThatTokensBelongTo(originalId, newCardId);

        return ResponseEntity.ok("Printing Updated");
    }

    @GetMapping("/{deckId}/download")
    public ResponseEntity<FileSystemResource> downloadDeckList(@AuthenticationPrincipal Jwt jwt,
            @PathVariable int deckId) {
        FileService fileService = new FileService();

        List<MagicDeckCard> deckList = this.magicDeckCardService.getAllCardByDeckId(deckId);

        try {
            File file = fileService.createDefaultDeckList(deckList);
            FileSystemResource resource = new FileSystemResource(file);
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName());
            return new ResponseEntity<>(resource, headers, HttpStatus.OK);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{deckId}/import-deck-text")
    public ResponseEntity<String> importDeckText(@AuthenticationPrincipal Jwt jwt, @PathVariable int deckId,
            @RequestBody DeckUploadTextRequest upload) {
            

        String userId = jwt.getSubject();
        MagicDeck deck = this.magicDeckService.getDeckByDeckIdAndUserId(deckId, userId);

        // // Add all the card names to a list
        // List<String> cardsToCheck = new ArrayList<>();

        // for (MagicCardRequest card: upload.getCards()) {
        //     cardsToCheck.add(card.getName());
        // }
        
        // Check which cards are already in the db
        // List<String> existingCards = magicCardService.batchCheckIfCardsExist(cardsToCheck);

        // Create the cards that are not already in the deck
        for(MagicCardRequest card: upload.getCards()) {
            // Create the cards that are not already in the deck
            // if (!existingCards.contains(card.getName())) {
            //     this.magicCardService.getOrCreateNewCard(card);
            // }

            // Add the card to the deck TODO: It is currnetly just on copy fix this
            this.magicDeckService.addCardToDeck(deck, card);
        }

        // Do a batch insert of all the cards

        

        return ResponseEntity.ok("Thansk");
    }
}