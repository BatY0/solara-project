package com.solara.backend.service;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class CookieService {

    private final long accessCookieExpirationHours = 1; // 1 hour
    private final long refreshCookieExpirationDays = 7; // 7 days

    public ResponseCookie buildAccessCookie(String token) {
        return ResponseCookie.from("accessToken", token)
                .httpOnly(true)
                .secure(true) // Ensure true in production (HTTPS)
                .path("/")
                .maxAge(accessCookieExpirationHours * 60 * 60)
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(true)
                .path("/api/v1/auth")
                .maxAge(refreshCookieExpirationDays * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie clearAccessCookie() {
        return ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0) // 0 forces browser to delete
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/api/v1/auth")
                .maxAge(0) // 0 forces browser to delete
                .sameSite("Lax")
                .build();
    }

    
}
