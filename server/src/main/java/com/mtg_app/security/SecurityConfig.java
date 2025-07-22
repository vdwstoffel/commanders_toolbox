package com.mtg_app.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.List;

@Configuration
public class SecurityConfig {

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                return http
                                .authorizeHttpRequests(authorize -> authorize
                                                .requestMatchers("/api/v1/explore/**").permitAll()
                                                .requestMatchers("/api/v1/decks/**").authenticated()
                                                .anyRequest().authenticated())
                                .cors(withDefaults())
                                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()))
                                .csrf(csrf -> csrf
                                                .ignoringRequestMatchers("/api/v1/explore/**"))
                                .build();
        }
}
