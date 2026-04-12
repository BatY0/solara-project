package com.solara.backend.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.solara.backend.dto.request.ChatbotPrompt;
import com.solara.backend.dto.request.ChatbotServiceMessage;
import com.solara.backend.dto.request.ChatbotServiceRequest;
import com.solara.backend.entity.ChatMessage;
import com.solara.backend.entity.ChatThread;
import com.solara.backend.repository.ChatMessageRepository;
import com.solara.backend.repository.ChatThreadRepository;

@Service
public class ChatService {


    private final ChatMessageRepository chatMessageRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final RestTemplate restTemplate;

    // Explicit constructor to hook up the chatbotRestTemplate
    public ChatService(ChatMessageRepository chatMessageRepository,
                       ChatThreadRepository chatThreadRepository,
                       @Qualifier("chatbotRestTemplate") RestTemplate restTemplate) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatThreadRepository = chatThreadRepository;
        this.restTemplate = restTemplate;
    }

    @Value("${chatbot.engine.url:http://localhost:8001/api/v1/chat}")
    private String chatbotUrl;

    public ChatMessage processChat(UUID userId, ChatbotPrompt request) {
        
        // 1. Resolve or Create Thread
        ChatThread thread;
        if (request.getThreadId() == null) {
            thread = new ChatThread();
            thread.setUserId(userId);
            thread = chatThreadRepository.save(thread);
        } else {
            thread = chatThreadRepository.findById(request.getThreadId())
                .orElseThrow(() -> new RuntimeException("Thread not found"));
            
            // Optional: verify the thread actually belongs to this userId
            if (!thread.getUserId().equals(userId)) {
                throw new RuntimeException("Unauthorized to access this thread");
            }
        }

        // 2. Save the new user prompt
        ChatMessage userMessage = new ChatMessage();
        userMessage.setThreadId(thread.getId());
        userMessage.setRole(ChatMessage.ChatRole.user);
        userMessage.setText(request.getPrompt());
        userMessage.setCropId(request.getCropId());
        chatMessageRepository.save(userMessage);

        // 3. Fetch Chat History restricted to this specific thread
        List<ChatMessage> fullThreadHistory = chatMessageRepository.findTop10ByThreadIdOrderByCreatedAtDesc(thread.getId());
        // 3.5 Reverse it so the bot reads it chronologically (Oldest to Newest)
        Collections.reverse(fullThreadHistory);

        // 4. Map history for the Python Service
        List<ChatbotServiceMessage> historyForPython = fullThreadHistory.stream()
                .map(msg -> {
                    // Python expects "model" instead of "chatbot"
                    String mappedRole = msg.getRole() == ChatMessage.ChatRole.chatbot ? "model" : "user";
                    String activeCropId = (msg.getCropId() != null) 
                            ? msg.getCropId().toString() 
                            : null;
                    return new ChatbotServiceMessage(mappedRole, msg.getText(), activeCropId);
                })
                .collect(Collectors.toList());

        ChatbotServiceRequest botRequest = new ChatbotServiceRequest();
        botRequest.setMessage(request.getPrompt()); // Pass the actual new message here
        botRequest.setConversation_history(historyForPython);
        botRequest.setCrop_id(
            (request.getCropId() != null) 
                ? request.getCropId().toString() 
                : null
        );

        // 5. Send to Python Chatbot Service
        Map<String, Object> pythonResponse = restTemplate.postForObject(chatbotUrl, botRequest, Map.class);
        String botReplyText = "Error connecting to chatbot.";
        if (pythonResponse != null && pythonResponse.containsKey("reply")) {
            botReplyText = (String) pythonResponse.get("reply");
        }
        // 6. Save the chatbot's response
        ChatMessage botMessage = new ChatMessage();
        botMessage.setThreadId(thread.getId());
        botMessage.setRole(ChatMessage.ChatRole.chatbot);
        botMessage.setText(botReplyText);
        botMessage.setCropId(request.getCropId());
        chatMessageRepository.save(botMessage);

        // 7. Return response (the frontend can extract botMessage.getThreadId() to use for the next request)
        return botMessage;
    }
}
