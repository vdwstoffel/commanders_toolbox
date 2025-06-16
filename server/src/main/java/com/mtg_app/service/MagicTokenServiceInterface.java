package com.mtg_app.service;

import java.util.Optional;

import com.mtg_app.entity.MagicToken;

public interface MagicTokenServiceInterface {
    MagicToken getOrCreateToken(String tokenId);
    Optional<MagicToken> getMagicTokenById(String tokenId);
}
