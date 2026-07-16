package com.mtg_app.service;

public interface AuthServiceInterface {
    String register(String email, String password);

    String login(String email, String password);
}
