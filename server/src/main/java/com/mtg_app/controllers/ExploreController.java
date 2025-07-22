package com.mtg_app.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mtg_app.dto.StringListOfCards;
import com.mtg_app.service.MagicCardService;

/*
 * This controller manages the the calls related to exploring decks
 */

@RestController
@RequestMapping("/api/v1/explore")
public class ExploreController {

    private final MagicCardService magicCardService;

    public ExploreController(MagicCardService magicCardService) {
        this.magicCardService = magicCardService;
    }

    @PostMapping
    public void getBatchCardInfo(@RequestBody StringListOfCards cards) {

        System.out.println(cards);
    }

}
