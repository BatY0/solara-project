package com.solara.backend.dto.request;

import java.util.UUID;

import lombok.Data;

@Data
public class ChatbotPrompt {
    private String prompt;
    private UUID cropId;
    private UUID threadId; // If null, backend should create a new thread
}
