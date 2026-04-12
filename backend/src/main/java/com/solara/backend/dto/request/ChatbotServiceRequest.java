package com.solara.backend.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ChatbotServiceRequest {
    private String message;

    @JsonProperty("conversation_history")
    private List<ChatbotServiceMessage> conversationHistory;

    @JsonProperty("crop_id")
    private String cropId;
}