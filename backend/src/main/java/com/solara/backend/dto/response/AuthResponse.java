package com.solara.backend.dto.response;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private String username;
    //private String token;
}