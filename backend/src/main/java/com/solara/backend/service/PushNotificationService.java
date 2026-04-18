package com.solara.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.solara.backend.entity.AlertEvent;
import com.solara.backend.entity.DevicePushToken;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {
    private final RestTemplate restTemplate;
    private final PushTokenService pushTokenService;

    @Value("${expo.push.url:https://exp.host/--/api/v2/push/send}")
    private String expoPushUrl;

    @Async
    public void sendAlertTriggeredPush(UUID userId, String fieldName, AlertEvent event) {
        String title = "Alert: " + event.getRuleName();
        String body = fieldName + " - " + event.getMetric() + " is " + event.getLastValue()
                + " (threshold: " + event.getThreshold() + ")";

        Map<String, Object> data = new HashMap<>();
        data.put("type", "alert_breach");
        data.put("eventId", event.getId().toString());
        data.put("fieldId", event.getFieldId().toString());

        sendToUserTokens(userId, title, body, data);
    }

    @Async
    public void sendOfflineDevicePush(UUID userId, String fieldName, String serialNumber) {
        String title = "Device Offline Alert";
        String body = "Device " + serialNumber + " for " + fieldName + " has been offline for 24h.";

        Map<String, Object> data = new HashMap<>();
        data.put("type", "device_offline");
        data.put("fieldName", fieldName);
        data.put("deviceSerialNumber", serialNumber);

        sendToUserTokens(userId, title, body, data);
    }

    private void sendToUserTokens(UUID userId, String title, String body, Map<String, Object> data) {
        List<DevicePushToken> activeTokens = pushTokenService.getActiveTokens(userId);
        if (activeTokens.isEmpty()) {
            return;
        }

        List<Map<String, Object>> payload = new ArrayList<>();
        for (DevicePushToken tokenEntity : activeTokens) {
            Map<String, Object> message = new HashMap<>();
            message.put("to", tokenEntity.getExpoPushToken());
            message.put("title", title);
            message.put("body", body);
            message.put("sound", "default");
            message.put("channelId", "alerts");
            message.put("priority", "high");
            message.put("data", data);
            payload.add(message);
        }

        try {
            Map<?, ?> response = restTemplate.postForObject(expoPushUrl, payload, Map.class);
            handleExpoErrors(activeTokens, response);
        } catch (Exception ex) {
            log.error("[Push] Failed to send Expo push to user {}", userId, ex);
        }
    }

    private void handleExpoErrors(List<DevicePushToken> sentTokens, Map<?, ?> response) {
        if (response == null || !(response.get("data") instanceof List<?> responseData)) {
            return;
        }

        for (int i = 0; i < responseData.size() && i < sentTokens.size(); i++) {
            Object ticketObj = responseData.get(i);
            if (!(ticketObj instanceof Map<?, ?> ticket)) {
                continue;
            }

            Object status = ticket.get("status");
            if (!"error".equals(status)) {
                continue;
            }

            Object detailsObj = ticket.get("details");
            if (!(detailsObj instanceof Map<?, ?> details)) {
                continue;
            }

            Object errorCode = details.get("error");
            if (!"DeviceNotRegistered".equals(errorCode)) {
                continue;
            }

            String token = sentTokens.get(i).getExpoPushToken();
            pushTokenService.deactivateToken(token);
            log.info("[Push] Deactivated invalid Expo token {}", token);
        }
    }
}
