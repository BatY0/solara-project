package com.solara.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UnregisterPushTokenRequest {
    @NotBlank(message = "expoPushToken is required")
    @Size(max = 255)
    private String expoPushToken;
}
