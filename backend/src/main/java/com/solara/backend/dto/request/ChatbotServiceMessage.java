package com.solara.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatbotServiceMessage {
    private String role; // "user" or "chatbot" (or "assistant" depending on your python bot)
    private String content; // The text prompt or response
    private String crop_id;
}