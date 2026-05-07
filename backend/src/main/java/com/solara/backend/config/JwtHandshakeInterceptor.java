package com.solara.backend.config;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.solara.backend.service.JwtService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            String jwt = null;
            String wsProtocol = servletRequest.getHeader("Sec-WebSocket-Protocol");
            log.info("[WS-HANDSHAKE] Incoming uri='{}' protocol='{}'", servletRequest.getRequestURI(), wsProtocol);

            // 1. Try Query Param (Mobile)
            jwt = servletRequest.getParameter("token");
            
            // 2. Try Cookie (Web)
            if (jwt == null) {
                Cookie[] cookies = servletRequest.getCookies();
                if (cookies != null) {
                    for (Cookie cookie : cookies) {
                        if ("accessToken".equals(cookie.getName())) {
                            jwt = cookie.getValue();
                            break;
                        }
                    }
                }
            }

            if (jwt != null) {
                try {
                    String userEmail = jwtService.extractUsername(jwt);
                    if (userEmail != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                        if (jwtService.isTokenValid(jwt, userDetails)) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            
                            // CRITICAL: Put it in the attributes under multiple keys to be sure
                            attributes.put("user", authToken);
                            attributes.put("SPRING_SECURITY_CONTEXT_PRINCIPAL", authToken);
                            
                            log.info("[WS-HANDSHAKE] SUCCESS: User '{}' is authenticated.", userEmail);
                        }
                    }
                } catch (Exception e) {
                    log.error("[WS-HANDSHAKE] Token validation error: {}", e.getMessage());
                }
            } else {
                log.warn("[WS-HANDSHAKE] No token found in query params or cookies.");
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
    }
}
