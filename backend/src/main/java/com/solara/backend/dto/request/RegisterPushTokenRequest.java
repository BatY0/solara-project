package com.solara.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterPushTokenRequest {
    @NotBlank(message = "expoPushToken is required")
    @Size(max = 255)
    private String expoPushToken;

    @NotBlank(message = "platform is required")
    @Size(max = 32)
    private String platform;

    @Size(max = 255)
    private String deviceId;

    @Size(max = 255)
    private String deviceName;
}
