package com.solara.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.ChatbotPrompt;
import com.solara.backend.entity.ChatMessage;
import com.solara.backend.entity.User;
import com.solara.backend.service.ChatService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatMessage> askChatbot(@RequestBody ChatbotPrompt request, @AuthenticationPrincipal User currentUser) {
        ChatMessage response = chatService.processChat(currentUser.getID(), request);
        return ResponseEntity.ok(response);
    }
}
