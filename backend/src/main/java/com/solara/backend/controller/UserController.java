package com.solara.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.VerifyConfirmDTO;
import com.solara.backend.dto.request.ChangePasswordDTO;
import com.solara.backend.dto.request.UpdateProfileDTO;
import com.solara.backend.dto.response.UserDTO;
import com.solara.backend.dto.response.VerifyResponse;
import com.solara.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PostMapping("/me/delete-request")
    public ResponseEntity<VerifyResponse> requestAccountDeletion() {
        try {
            return ResponseEntity.ok(userService.requestAccountDeletion());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    VerifyResponse.builder()
                            .message(e.getMessage())
                            .isVerified(false)
                            .build());
        }
    }

    @DeleteMapping("/me/delete-confirm")
    public ResponseEntity<VerifyResponse> confirmAccountDeletion(@Valid @RequestBody VerifyConfirmDTO request) {
        try {
            return ResponseEntity.ok(userService.confirmAccountDeletion(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    VerifyResponse.builder()
                            .message(e.getMessage())
                            .isVerified(false)
                            .build());
        }
    }

    @PutMapping("/me/password")
    public ResponseEntity<VerifyResponse> changePassword(@Valid @RequestBody ChangePasswordDTO request) {
        try {
            return ResponseEntity.ok(userService.changePassword(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    VerifyResponse.builder()
                            .message(e.getMessage())
                            .isVerified(false)
                            .build());
        }
    }

    @PutMapping("/me/profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody UpdateProfileDTO request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }
}
