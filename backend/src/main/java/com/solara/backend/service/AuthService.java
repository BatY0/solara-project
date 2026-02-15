package com.solara.backend.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
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

    public AuthResponse registerUser(RegisterDTO registerRequest){

        if(userRepo.existsByUsername(registerRequest.getUsername())) {
            return AuthResponse.builder().message("Username is already taken").build();
        }

        if(userRepo.existsByEmail(registerRequest.getEmail())) {
            return AuthResponse.builder().message("Email is already registered").build();
        }

        User newUser = User.builder()
            .username(registerRequest.getUsername())
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
            .username(newUser.getUsername())
            .token(jwtToken)
            .build();
    }

    public AuthResponse login(LoginDTO loginRequest) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),
                loginRequest.getPassword()
            )
        );

        var user = userRepo.findByEmail(loginRequest.getEmail())
            .orElseThrow();
            
        var jwtToken = jwtService.generateToken(user);
        
        return AuthResponse.builder()
            .message("Login successful")
            .username(user.getUsername())
            .token(jwtToken)
            .build();
    }
}
