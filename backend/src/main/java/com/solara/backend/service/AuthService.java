package com.solara.backend.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.RegisterDTO;
import com.solara.backend.dto.response.AuthResponse;
import com.solara.backend.entity.User;
import com.solara.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse registerUser(RegisterDTO registerRequest){

        if(userRepo.existsByUsername(registerRequest.getUsername())) {
            return AuthResponse.builder()
                .message("Username is already taken")
                .build();
        }

        if(userRepo.existsByEmail(registerRequest.getEmail())) {
            return AuthResponse.builder()
                .message("Email is already registered")
                .build();
        }

        User newUser = User.builder()
            .username(registerRequest.getUsername())
            .email(registerRequest.getEmail())
            .name(registerRequest.getName())
            .surname(registerRequest.getSurname())
            .password(passwordEncoder.encode(registerRequest.getPassword()))
            .role("USER")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        userRepo.save(newUser);

        return AuthResponse.builder()
            .message("User registered successfully")
            .username(newUser.getUsername())
            .build();
    }
}
