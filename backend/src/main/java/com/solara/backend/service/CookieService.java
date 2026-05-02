package com.solara.backend.service;

import org.springframework.http.ResponseCookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CookieService {
    public static final String REFRESH_COOKIE_V2 = "refreshToken_v2";

    private final long accessCookieExpirationHours = 1; // 1 hour
    private final long refreshCookieExpirationDays = 7; // 7 days
    private final boolean secureCookies;
    private final String sameSite;

    public CookieService(
            @Value("${app.cookies.secure:true}") boolean secureCookies,
            @Value("${app.cookies.same-site:Lax}") String sameSite
    ) {
        this.secureCookies = secureCookies;
        this.sameSite = sameSite;
    }

    public ResponseCookie buildAccessCookie(String token) {
        return ResponseCookie.from("accessToken", token)
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(accessCookieExpirationHours * 60 * 60)
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE_V2, token)
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(refreshCookieExpirationDays * 24 * 60 * 60)
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie clearAccessCookie() {
        return ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(0) // 0 forces browser to delete
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_V2, "")
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .maxAge(0) // 0 forces browser to delete
                .sameSite(sameSite)
                .build();
    }

}
