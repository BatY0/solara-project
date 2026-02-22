package com.solara.backend.service;

import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.VerifyConfirmDTO;
import com.solara.backend.dto.request.VerifyRequestDTO;
import com.solara.backend.dto.response.VerifyResponse;
import com.solara.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Mock verification service — uses a hardcoded code "123456" instead of sending
 * real emails.
 * Replace this with actual SMTP integration when ready.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final UserRepository userRepo;

    // TODO: Replace with real SMTP service and random code generation
    private static final String MOCK_CODE = "123456";

    public VerifyResponse requestVerification(VerifyRequestDTO request) {
        String email = request.getEmail();

        // In production: generate random 6-digit code, store it with TTL, send via SMTP
        log.info("[MOCK] Verification code '{}' sent to {}", MOCK_CODE, email);

        return VerifyResponse.builder()
                .message("Verification code sent to " + email)
                .build();
    }

    public VerifyResponse confirmVerification(VerifyConfirmDTO request) {
        String email = request.getEmail();
        String code = request.getCode();

        // In production: look up stored code for this email and compare
        if (MOCK_CODE.equals(code)) {
            log.info("[MOCK] Email {} verified successfully", email);

            // Update user's verified status in the database
            userRepo.findByEmail(email).ifPresent(user -> {
                user.setEmailVerified(true);
                userRepo.save(user);
            });

            return VerifyResponse.builder()
                    .message("Email verified successfully.")
                    .isVerified(true)
                    .build();
        } else {
            log.warn("[MOCK] Invalid verification code '{}' for {}", code, email);
            throw new IllegalArgumentException("Invalid verification code");
        }
    }
}
