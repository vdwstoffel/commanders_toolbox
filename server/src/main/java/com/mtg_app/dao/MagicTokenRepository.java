package com.mtg_app.dao;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mtg_app.entity.MagicToken;

public interface MagicTokenRepository extends JpaRepository<MagicToken, String> {
    //basic crud extended from JPA


    
}
