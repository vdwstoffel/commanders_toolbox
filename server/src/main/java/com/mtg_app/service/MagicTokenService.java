package com.mtg_app.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.MagicTokenRepository;
import com.mtg_app.dto.MagicTokenResponse;
import com.mtg_app.entity.MagicToken;
import com.mtg_app.tools.ScryfallApi;

@Service
public class MagicTokenService implements MagicTokenServiceInterface {
    private MagicTokenRepository magicTokenRepository;

    @Autowired
    public MagicTokenService(MagicTokenRepository magicTokenRepository) {
        this.magicTokenRepository = magicTokenRepository;
    }

    @Override
    public Optional<MagicToken> getMagicTokenById(String tokenId) {
        return this.magicTokenRepository.findById(tokenId);
    }

    @Override
    public MagicToken getOrCreateToken(String tokenId) {

        Optional<MagicToken> exists = this.getMagicTokenById(tokenId);

        if (!exists.isPresent()) {
            ScryfallApi scryfallApi = new ScryfallApi();
            MagicTokenResponse tokenData = scryfallApi.getTokenDetails(tokenId);

            String id = tokenData.getId();
            String name = tokenData.getName();
            String image = tokenData.getImage_uris().getLarge();
            String typeLine = tokenData.getType_line();
            String oracleText = tokenData.getOracle_text();
            int power = tokenData.getPower();
            int toughness = tokenData.getToughness();

            MagicToken newToken = new MagicToken(id, name, image, typeLine, oracleText, power, toughness);
            return magicTokenRepository.save(newToken);
        }

        return exists.get();
    }

}
