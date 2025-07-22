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
        @Order(1)
        public SecurityFilterChain publicChain(HttpSecurity http) throws Exception {
                return http
                                .securityMatcher("/api/v1/explore/**")
                                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                                .cors(cors -> cors.configurationSource(request -> {
                                        var config = new org.springframework.web.cors.CorsConfiguration();
                                        config.setAllowedOrigins(List.of("*")); // Use your frontend origin in
                                                                                // production
                                        config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
                                        config.setAllowedHeaders(List.of("*"));
                                        config.setAllowCredentials(false); // Set true only if you're using cookies
                                        return config;
                                }))
                                .csrf(csrf -> csrf.disable()) // This is key if CSRF protection is interfering
                                .build();
        }

        @Bean
        @Order(2)
        public SecurityFilterChain protectedChain(HttpSecurity http) throws Exception {
                return http
                                .authorizeHttpRequests(authorize -> authorize
                                                .requestMatchers("/api/v1/decks/**").authenticated()
                                                .anyRequest().authenticated())
                                .cors(withDefaults())
                                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()))
                                .build();
        }
}
