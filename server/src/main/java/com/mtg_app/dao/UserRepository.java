package com.mtg_app.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mtg_app.entity.User;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
