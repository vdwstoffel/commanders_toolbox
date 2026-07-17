package com.mtg_app.service;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.mtg_app.dao.MagicDeckCardTokenRepository;
import com.mtg_app.entity.MagicDeckCardToken;

class MagicDeckCardTokenServiceTest {

    private final MagicDeckCardTokenRepository repo = mock(MagicDeckCardTokenRepository.class);
    private final MagicDeckCardTokenService service = new MagicDeckCardTokenService(repo);

    @Test
    void createsMappingWhenAbsent() {
        MagicDeckCardToken mapping = new MagicDeckCardToken(1, 2, "tok");
        when(repo.findByDeckIdAndCardIdAndTokenId(1, 2, "tok")).thenReturn(List.of());
        when(repo.save(mapping)).thenReturn(mapping);

        MagicDeckCardToken result = service.createDeckCardTokenMapping(mapping);

        assertSame(mapping, result);
        verify(repo).save(mapping);
    }

    @Test
    void doesNotDuplicateWhenPresent() {
        MagicDeckCardToken existing = new MagicDeckCardToken(1, 2, "tok");
        when(repo.findByDeckIdAndCardIdAndTokenId(1, 2, "tok")).thenReturn(List.of(existing));

        MagicDeckCardToken result = service.createDeckCardTokenMapping(new MagicDeckCardToken(1, 2, "tok"));

        assertSame(existing, result);
        verify(repo, never()).save(any());
    }
}
