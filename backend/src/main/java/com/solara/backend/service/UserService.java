package com.solara.backend.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.VerifyConfirmDTO;
import com.solara.backend.dto.request.ChangePasswordDTO;
import com.solara.backend.dto.request.UpdateProfileDTO;
import com.solara.backend.dto.response.UserDTO;
import com.solara.backend.dto.response.VerifyResponse;
import com.solara.backend.entity.User;
import com.solara.backend.entity.VerificationCode;
import com.solara.backend.repository.UserRepository;
import com.solara.backend.repository.VerificationCodeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepo;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public User getCurrentUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String currentEmail;
        if (principal instanceof UserDetails) {
            currentEmail = ((UserDetails) principal).getUsername();
        } else {
            currentEmail = principal.toString();
        }
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UserDTO getCurrentUser() {
        User user = getCurrentUserEntity();
        return UserDTO.builder()
                .id(user.getID())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public VerifyResponse requestAccountDeletion() {
        User user = getCurrentUserEntity();
        String email = user.getEmail();

        String code = String.format("%06d", new Random().nextInt(999999));

        verificationCodeRepo.deleteByEmail(email);

        VerificationCode verificationCode = VerificationCode.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        verificationCodeRepo.save(verificationCode);

        emailService.sendAccountDeletionCode(email, code);

        return VerifyResponse.builder()
                .message("Account deletion verification code sent to " + email)
                .build();
    }

    public VerifyResponse confirmAccountDeletion(VerifyConfirmDTO request) {
        User user = getCurrentUserEntity();
        String email = user.getEmail();
        String code = request.getCode();

        VerificationCode verificationCode = verificationCodeRepo.findByEmailAndCode(email, code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            verificationCodeRepo.delete(verificationCode);
            throw new IllegalArgumentException("Verification code has expired");
        }

        // Valid code, proceed with deletion
        userRepository.delete(user);
        verificationCodeRepo.delete(verificationCode);

        log.info("User {} deleted successfully.", email);

        return VerifyResponse.builder()
                .message("Account deleted successfully.")
                .isVerified(true)
                .build();
    }

    public VerifyResponse changePassword(ChangePasswordDTO request) {
        User user = getCurrentUserEntity();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return VerifyResponse.builder()
                .message("Password updated successfully.")
                .isVerified(true)
                .build();
    }

    public UserDTO updateProfile(UpdateProfileDTO request) {
        User user = getCurrentUserEntity();

        user.setName(request.getName());
        user.setSurname(request.getSurname());
        userRepository.save(user);

        return UserDTO.builder()
                .id(user.getID())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
