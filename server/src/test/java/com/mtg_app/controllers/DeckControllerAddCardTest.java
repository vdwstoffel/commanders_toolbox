package com.mtg_app.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.mtg_app.entity.MagicDeck;
import com.mtg_app.service.MagicCardService;
import com.mtg_app.service.MagicDeckCardService;
import com.mtg_app.service.MagicDeckCardTokenService;
import com.mtg_app.service.MagicDeckService;

class DeckControllerAddCardTest {

    private MagicDeckService magicDeckService;
    private MockMvc mockMvc;
    private final MagicDeck deck = new MagicDeck();

    @BeforeEach
    void setup() {
        MagicCardService magicCardService = mock(MagicCardService.class);
        magicDeckService = mock(MagicDeckService.class);
        MagicDeckCardService magicDeckCardService = mock(MagicDeckCardService.class);
        MagicDeckCardTokenService magicDeckCardTokenService = mock(MagicDeckCardTokenService.class);

        DeckController controller = new DeckController(magicCardService, magicDeckService, magicDeckCardService,
                magicDeckCardTokenService);

        HandlerMethodArgumentResolver jwtResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(Jwt.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return Jwt.withTokenValue("t").header("alg", "none").subject("user-1").build();
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(jwtResolver)
                .setControllerAdvice(new RestExceptionHandler())
                .build();

        when(magicDeckService.getDeckByDeckIdAndUserId(1, "user-1")).thenReturn(deck);
    }

    @Test
    void defaultsQuantityToOne() throws Exception {
        mockMvc.perform(post("/api/v1/decks/1/add-card")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Sol Ring\",\"tcgplayer_id\":1,\"color_identity\":[]}"))
                .andExpect(status().isOk());
        verify(magicDeckService).addCardToDeck(eq(deck), any(), eq(1));
    }

    @Test
    void passesExplicitQuantity() throws Exception {
        mockMvc.perform(post("/api/v1/decks/1/add-card?quantity=3")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Sol Ring\",\"tcgplayer_id\":1,\"color_identity\":[]}"))
                .andExpect(status().isOk());
        verify(magicDeckService).addCardToDeck(eq(deck), any(), eq(3));
    }

    @Test
    void rejectsQuantityBelowOne() throws Exception {
        mockMvc.perform(post("/api/v1/decks/1/add-card?quantity=0")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Sol Ring\",\"tcgplayer_id\":1,\"color_identity\":[]}"))
                .andExpect(status().isBadRequest());
    }
}
