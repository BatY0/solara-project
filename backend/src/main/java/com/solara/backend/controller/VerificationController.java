package com.solara.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.ResetPasswordDTO;
import com.solara.backend.dto.request.VerifyConfirmDTO;
import com.solara.backend.dto.request.VerifyRequestDTO;
import com.solara.backend.dto.response.VerifyResponse;
import com.solara.backend.service.VerificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth/verify")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/request")
    public ResponseEntity<VerifyResponse> requestVerification(@Valid @RequestBody VerifyRequestDTO request) {
        try {
            return ResponseEntity.ok(verificationService.requestVerification(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    VerifyResponse.builder()
                            .message(e.getMessage())
                            .isVerified(false)
                            .build());
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<VerifyResponse> confirmVerification(@Valid @RequestBody VerifyConfirmDTO request) {
        try {
            return ResponseEntity.ok(verificationService.confirmVerification(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    VerifyResponse.builder()
                            .message(e.getMessage())
                            .isVerified(false)
                            .build());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<VerifyResponse> resetPassword(@Valid @RequestBody ResetPasswordDTO request) {
        try {
            return ResponseEntity.ok(verificationService.resetPassword(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    VerifyResponse.builder()
                            .message(e.getMessage())
                            .isVerified(false)
                            .build());
        }
    }
}
