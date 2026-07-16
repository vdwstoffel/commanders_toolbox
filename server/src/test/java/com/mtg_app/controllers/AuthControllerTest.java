package com.mtg_app.controllers;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.mtg_app.service.AuthService;

class AuthControllerTest {

    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        authService = mock(AuthService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new RestExceptionHandler())
                .build();
    }

    @Test
    void registerReturnsToken() throws Exception {
        when(authService.register(anyString(), anyString())).thenReturn("tok-1");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@b.com\",\"password\":\"pw\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("tok-1"));
    }

    @Test
    void loginErrorBecomesBadRequestWithMessage() throws Exception {
        when(authService.login(anyString(), anyString()))
                .thenThrow(new RuntimeException("Invalid email or password"));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@b.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }
}
