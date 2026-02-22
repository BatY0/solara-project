package com.solara.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.ResetPasswordDTO;
import com.solara.backend.dto.request.VerifyConfirmDTO;
import com.solara.backend.dto.request.VerifyRequestDTO;
import com.solara.backend.dto.response.VerifyResponse;
import com.solara.backend.entity.VerificationCode;
import com.solara.backend.repository.UserRepository;
import com.solara.backend.repository.VerificationCodeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Random;

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
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeRepository verificationCodeRepo;
    private final EmailService emailService;

    public VerifyResponse requestVerification(VerifyRequestDTO request) {
        String email = request.getEmail();

        if (userRepo.findByEmail(email).isEmpty()) {
            throw new IllegalArgumentException("No account found with this email address");
        }

        // Generate 6-digit code
        String code = String.format("%06d", new Random().nextInt(999999));

        // Delete any existing codes for this user
        verificationCodeRepo.deleteByEmail(email);

        // Save new code
        VerificationCode verificationCode = VerificationCode.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        verificationCodeRepo.save(verificationCode);

        // Send email
        emailService.sendVerificationCode(email, code);

        return VerifyResponse.builder()
                .message("Verification code sent to " + email)
                .build();
    }

    public VerifyResponse confirmVerification(VerifyConfirmDTO request) {
        String email = request.getEmail();
        String code = request.getCode();

        VerificationCode verificationCode = checkValidCode(email, code);

        log.info("Email {} verified successfully", email);

        userRepo.findByEmail(email).ifPresent(user -> {
            user.setEmailVerified(true);
            userRepo.save(user);
        });

        // We DO NOT delete the verification code here!
        // If this is a forgot-password flow, Step 3 still needs the code.
        // The code will naturally expire or be deleted when Step 3 is completed.

        return VerifyResponse.builder()
                .message("Email verified successfully.")
                .isVerified(true)
                .build();
    }

    public VerifyResponse resetPassword(ResetPasswordDTO request) {
        String email = request.getEmail();
        String newPassword = request.getNewPassword();
        String code = request.getCode();

        VerificationCode verificationCode = checkValidCode(email, code);

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // Delete the code after successful use
        verificationCodeRepo.delete(verificationCode);

        log.info("Password reset successfully for {}", email);

        return VerifyResponse.builder()
                .message("Password has been reset successfully.")
                .isVerified(true)
                .build();
    }

    private VerificationCode checkValidCode(String email, String code) {
        VerificationCode verificationCode = verificationCodeRepo.findByEmailAndCode(email, code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            verificationCodeRepo.delete(verificationCode); // Cleanup expired code
            throw new IllegalArgumentException("Verification code has expired");
        }

        return verificationCode;
    }
}
