package com.mtg_app.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mtg_app.dao.UserRepository;
import com.mtg_app.entity.User;

@Service
public class AuthService implements AuthServiceInterface {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public String register(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new RuntimeException("Email and password are required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("An account with this email already exists");
        }
        User user = new User(UUID.randomUUID().toString(), email, passwordEncoder.encode(password));
        userRepository.save(user);
        return jwtService.generateToken(user.getId());
    }

    @Override
    public String login(String email, String password) {
        Optional<User> maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty() || !passwordEncoder.matches(password, maybeUser.get().getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }
        return jwtService.generateToken(maybeUser.get().getId());
    }
}
