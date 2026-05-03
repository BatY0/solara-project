package com.solara.backend.service;

import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.LoginDTO;
import com.solara.backend.dto.request.RegisterDTO;
import com.solara.backend.dto.response.AuthResponse;
import com.solara.backend.entity.RefreshToken;
import com.solara.backend.entity.Role;
import com.solara.backend.entity.User;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.RefreshRepository;
import com.solara.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshRepository refreshTokenRepo;
    private final AuthenticationManager authenticationManager;

    public record AuthResult(AuthResponse authResponse, String accessToken, String refreshToken) {}

    public AuthResult registerUser(RegisterDTO registerRequest) {

        if (userRepo.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        User newUser = User.builder()
                .email(registerRequest.getEmail())
                .name(registerRequest.getName())
                .surname(registerRequest.getSurname())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.USER) // Using Enum
                .preferredLanguage(registerRequest.getPreferredLanguage() != null && !registerRequest.getPreferredLanguage().isBlank() 
                                    ? registerRequest.getPreferredLanguage().toLowerCase() : "en")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepo.save(newUser);

        // 1. Generate normal JWT Access Token
        var jwtToken = jwtService.generateToken(newUser);

        // 2. Generate secure random Refresh Token
        String plainRefreshToken = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        String hashedToken = hashToken(plainRefreshToken);

        // 3. Save Refresh Token to DB
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(newUser.getID())
                .tokenHash(hashedToken)
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepo.save(refreshTokenEntity);
        
        

        AuthResponse responseBody = AuthResponse.builder()
                .message("User registered successfully")
                .email(newUser.getEmail())
                .token(jwtToken) // included for mobile clients; web uses Set-Cookie
                .refreshToken(plainRefreshToken) // included for mobile clients; web uses Set-Cookie
                .build();

        return new AuthResult(responseBody, jwtToken, plainRefreshToken);

    }

    public AuthResult login(LoginDTO loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        var user = userRepo.findByEmail(loginRequest.getEmail())
                .orElseThrow();

        // Check if email is verified
        if (!user.isEmailVerified()) {
            return new AuthResult(
                    AuthResponse.builder()
                            .message("Email not verified")
                            .email(user.getEmail())
                            .emailVerified(false)
                            .build(),
                    null,
                    null
            );
        }

        // Generate Tokens
        String accessToken = jwtService.generateToken(user);
        String plainRefreshToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();

        // Save Refresh Token
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getID())
                .tokenHash(hashToken(plainRefreshToken))
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepo.save(refreshTokenEntity);

        // Build the ResponseBody
        AuthResponse responseBody = AuthResponse.builder()
                .message("Login successful")
                .email(user.getEmail())
                .emailVerified(true)
                .token(accessToken) // included for mobile clients; web uses Set-Cookie
                .refreshToken(plainRefreshToken) // included for mobile clients; web uses Set-Cookie
                .build();

        return new AuthResult(responseBody, accessToken, plainRefreshToken);
 
    }

    public AuthResult logout(String plainRefreshToken) {
        if (plainRefreshToken == null || plainRefreshToken.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Refresh token missing");
        }

        String hashedToken = hashToken(plainRefreshToken);
        RefreshToken storedToken = refreshTokenRepo.findByTokenHash(hashedToken)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Invalid refresh token"));

        storedToken.setExpiryDate(Instant.now()); // Expire immediately
        storedToken.setRevoked(true);
        refreshTokenRepo.save(storedToken);

        AuthResponse responseBody = AuthResponse.builder()
                .message("Logout successful")
                .build();
        
        return new AuthResult(responseBody, null, null);
    }

    public String[] refreshTokens(String plainRefreshToken) {
        if (plainRefreshToken == null || plainRefreshToken.isBlank()) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Refresh token missing");
        }

        String hashedToken = hashToken(plainRefreshToken);
        RefreshToken storedToken = refreshTokenRepo.findByTokenHash(hashedToken)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (storedToken.isRevoked() || storedToken.getExpiryDate().isBefore(Instant.now())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }

        User user = userRepo.findById(storedToken.getUserId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        // Optional Token Rotation: Revoke the old token and issue a new one
        storedToken.setRevoked(true);
        refreshTokenRepo.save(storedToken);

        // Generate new access token
        String newAccessToken = jwtService.generateToken(user);
        
        // Generate new refresh token
        String newPlainRefreshToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .userId(user.getID())
                .tokenHash(hashToken(newPlainRefreshToken))
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepo.save(newRefreshTokenEntity);

        return new String[]{newAccessToken, newPlainRefreshToken};
    }

    public void deleteUser(UUID id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
        userRepo.delete(user);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing token", e);
        }
    }
}
