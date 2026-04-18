package com.solara.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.RegisterPushTokenRequest;
import com.solara.backend.dto.request.UnregisterPushTokenRequest;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.entity.User;
import com.solara.backend.service.PushTokenService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class PushTokenController {
    private final PushTokenService pushTokenService;

    @PostMapping("/push-tokens")
    public ResponseEntity<ApiResponse<Void>> registerPushToken(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody RegisterPushTokenRequest request) {
        pushTokenService.registerToken(currentUser.getID(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, HttpStatus.CREATED.value(), "Push token registered"));
    }

    @DeleteMapping("/push-tokens")
    public ResponseEntity<ApiResponse<Void>> unregisterPushToken(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UnregisterPushTokenRequest request) {
        pushTokenService.unregisterToken(currentUser.getID(), request);
        return ResponseEntity.ok(ApiResponse.success(null, HttpStatus.OK.value(), "Push token deactivated"));
    }
}
