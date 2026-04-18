package com.solara.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.dto.request.RegisterPushTokenRequest;
import com.solara.backend.dto.request.UnregisterPushTokenRequest;
import com.solara.backend.entity.DevicePushToken;
import com.solara.backend.repository.DevicePushTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PushTokenService {
    private final DevicePushTokenRepository devicePushTokenRepository;

    @Transactional
    public void registerToken(UUID userId, RegisterPushTokenRequest request) {
        String normalizedToken = request.getExpoPushToken().trim();
        String normalizedDeviceId = normalizeOptional(request.getDeviceId());
        String normalizedDeviceName = normalizeOptional(request.getDeviceName());
        String normalizedPlatform = request.getPlatform().trim().toLowerCase();

        DevicePushToken tokenEntity = devicePushTokenRepository.findByExpoPushToken(normalizedToken)
                .orElseGet(() -> {
                    if (normalizedDeviceId != null) {
                        return devicePushTokenRepository.findByUserIdAndDeviceId(userId, normalizedDeviceId)
                                .orElse(DevicePushToken.builder().build());
                    }
                    return DevicePushToken.builder().build();
                });

        tokenEntity.setUserId(userId);
        tokenEntity.setExpoPushToken(normalizedToken);
        tokenEntity.setPlatform(normalizedPlatform);
        tokenEntity.setDeviceId(normalizedDeviceId);
        tokenEntity.setDeviceName(normalizedDeviceName);
        tokenEntity.setActive(true);
        devicePushTokenRepository.save(tokenEntity);
    }

    @Transactional
    public void unregisterToken(UUID userId, UnregisterPushTokenRequest request) {
        String normalizedToken = request.getExpoPushToken().trim();
        devicePushTokenRepository.findByUserIdAndExpoPushToken(userId, normalizedToken)
                .ifPresent(tokenEntity -> {
                    tokenEntity.setActive(false);
                    devicePushTokenRepository.save(tokenEntity);
                });
    }

    public List<DevicePushToken> getActiveTokens(UUID userId) {
        return devicePushTokenRepository.findByUserIdAndActiveTrue(userId);
    }

    @Transactional
    public void deactivateToken(String expoPushToken) {
        devicePushTokenRepository.findByExpoPushToken(expoPushToken)
                .ifPresent(tokenEntity -> {
                    tokenEntity.setActive(false);
                    devicePushTokenRepository.save(tokenEntity);
                });
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
