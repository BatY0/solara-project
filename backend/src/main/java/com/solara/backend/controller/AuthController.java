package com.solara.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.LoginDTO;
import com.solara.backend.dto.request.RegisterDTO;
import com.solara.backend.dto.response.AuthResponse;
import com.solara.backend.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterDTO registerDTO) {
        try {
            return ResponseEntity.ok(authService.registerUser(registerDTO));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    AuthResponse.builder().message(e.getMessage()).build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginDTO loginDTO) {
        return ResponseEntity.ok(authService.login(loginDTO));
    }
}
