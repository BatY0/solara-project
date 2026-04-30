package com.solara.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.LoginDTO;
import com.solara.backend.dto.request.RegisterDTO;
import com.solara.backend.dto.response.AuthResponse;
import com.solara.backend.service.AuthService;
import com.solara.backend.service.AuthService.AuthResult;
import com.solara.backend.service.CookieService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final CookieService cookieService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterDTO registerDTO) {
        AuthResult result = authService.registerUser(registerDTO);

        // Convert raw token strings to secure Cookie headers
        ResponseCookie accessCookie = cookieService.buildAccessCookie(result.accessToken());
        ResponseCookie refreshCookie = cookieService.buildRefreshCookie(result.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(result.authResponse()); 
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginDTO loginDTO) {
        AuthResult result = authService.login(loginDTO);

        // Provide early return for unverified email where no token is generated
        if (result.accessToken() == null) {
            return ResponseEntity.ok(result.authResponse());
        }

        // Convert raw token strings to secure Cookie headers
        ResponseCookie accessCookie = cookieService.buildAccessCookie(result.accessToken());
        ResponseCookie refreshCookie = cookieService.buildRefreshCookie(result.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(result.authResponse()); 
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        String[] newTokens = authService.refreshTokens(refreshToken);

        ResponseCookie newAccessCookie = cookieService.buildAccessCookie(newTokens[0]);
        ResponseCookie newRefreshCookie = cookieService.buildRefreshCookie(newTokens[1]);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
                .body("Tokens refreshed");
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        AuthResult result = authService.logout(refreshToken);

        ResponseCookie clearAccessCookie = cookieService.clearAccessCookie();
        ResponseCookie clearRefreshCookie = cookieService.clearRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .body(result.authResponse());
            
    }
}
