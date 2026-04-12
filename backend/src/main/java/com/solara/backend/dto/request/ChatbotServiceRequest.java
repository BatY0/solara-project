package com.solara.backend.dto.request;

import java.util.List;

import lombok.Data;

@Data
public class ChatbotServiceRequest {
    private String message;
    private List<ChatbotServiceMessage> conversation_history;
    private String crop_id;
}