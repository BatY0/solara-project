package com.solara.backend.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.LoginDTO;
import com.solara.backend.dto.request.RegisterDTO;
import com.solara.backend.dto.response.AuthResponse;
import com.solara.backend.entity.Role;
import com.solara.backend.entity.User;
import com.solara.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse registerUser(RegisterDTO registerRequest) {

        if (userRepo.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User newUser = User.builder()
                .email(registerRequest.getEmail())
                .name(registerRequest.getName())
                .surname(registerRequest.getSurname())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.USER) // Using Enum
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepo.save(newUser);

        var jwtToken = jwtService.generateToken(newUser);

        return AuthResponse.builder()
                .message("User registered successfully")
                .email(newUser.getEmail())
                .token(jwtToken)
                .build();
    }

    public AuthResponse login(LoginDTO loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        var user = userRepo.findByEmail(loginRequest.getEmail())
                .orElseThrow();

        // Check if email is verified
        if (!user.isEmailVerified()) {
            return AuthResponse.builder()
                    .message("Email not verified")
                    .email(user.getEmail())
                    .emailVerified(false)
                    .build();
        }

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .message("Login successful")
                .email(user.getEmail())
                .emailVerified(true)
                .token(jwtToken)
                .build();
    }
}
