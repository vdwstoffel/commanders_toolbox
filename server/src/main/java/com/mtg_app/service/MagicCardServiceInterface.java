package com.mtg_app.service;

import java.util.List;
import java.util.Optional;

import com.mtg_app.dto.MagicCardRequest;
import com.mtg_app.entity.MagicCard;

public interface MagicCardServiceInterface {
    MagicCard getOrCreateNewCard(MagicCardRequest card);

    Optional<MagicCard> getCardById(int cardId);

    List<String> batchCheckIfCardsExist(List<String> cards);

}
