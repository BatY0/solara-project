package com.solara.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.DevicePushToken;

public interface DevicePushTokenRepository extends JpaRepository<DevicePushToken, UUID> {
    Optional<DevicePushToken> findByExpoPushToken(String expoPushToken);
    Optional<DevicePushToken> findByUserIdAndDeviceId(UUID userId, String deviceId);
    Optional<DevicePushToken> findByUserIdAndExpoPushToken(UUID userId, String expoPushToken);
    List<DevicePushToken> findByUserIdAndActiveTrue(UUID userId);
}
