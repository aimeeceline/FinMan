package com.finman.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    // Valid Base64-encoded 256-bit key
    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("Should generate token and decode claims correctly")
    void testGenerateAndDecodeToken() {
        Long userId = 42L;
        String email = "alice@finman.com";

        String token = jwtTokenProvider.generateToken(userId, email);

        assertNotNull(token);
        assertTrue(token.length() > 20);

        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(userId, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals(email, jwtTokenProvider.getEmailFromToken(token));
    }

    @Test
    @DisplayName("Should reject invalid or tampered tokens")
    void testInvalidTokenRejection() {
        assertFalse(jwtTokenProvider.validateToken("invalid.jwt.token"));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken(null));

        String validToken = jwtTokenProvider.generateToken(1L, "user@finman.com");
        String tamperedToken = validToken + "tamper";
        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("Should reject expired token")
    void testExpiredTokenRejection() {
        // Create a provider with -1000ms expiration (already expired)
        JwtTokenProvider expiredProvider = new JwtTokenProvider(TEST_SECRET, -1000);
        String expiredToken = expiredProvider.generateToken(1L, "expired@finman.com");

        assertFalse(jwtTokenProvider.validateToken(expiredToken));
    }
}
