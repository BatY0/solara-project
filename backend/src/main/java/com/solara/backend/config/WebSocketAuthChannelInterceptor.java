package com.solara.backend.config;

import java.security.Principal;
import java.util.Map;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("[WS-STOMP] CONNECT frame received. Extracting user from session...");

            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null) {
                // Try multiple common keys for the principal
                Object principal = sessionAttributes.get("SPRING_SECURITY_CONTEXT_PRINCIPAL");
                if (principal == null) {
                    principal = sessionAttributes.get("user");
                }

                if (principal instanceof Principal) {
                    accessor.setUser((Principal) principal);
                    log.info("[WS-STOMP] SUCCESS: Linked user '{}' to STOMP session.", ((Principal) principal).getName());
                } else {
                    log.warn("[WS-STOMP] No Principal found in session attributes. Handshake was successful but attributes are missing.");
                    log.info("[WS-STOMP] Current Attributes: {}", sessionAttributes.keySet());
                }
            } else {
                log.warn("[WS-STOMP] Session attributes are NULL!");
            }
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            // This is the key signal we need when debugging "connected but no live updates".
            String destination = accessor.getDestination();
            String user = accessor.getUser() != null ? accessor.getUser().getName() : "<no-user>";
            String sessionId = accessor.getSessionId();
            log.info("[WS-STOMP] SUBSCRIBE user='{}' session='{}' destination='{}'", user, sessionId, destination);
        } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            String user = accessor.getUser() != null ? accessor.getUser().getName() : "<no-user>";
            String sessionId = accessor.getSessionId();
            log.info("[WS-STOMP] DISCONNECT user='{}' session='{}'", user, sessionId);
        }

        return message;
    }
}
