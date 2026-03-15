package com.solara.backend.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BasicResponse {
    @Builder.Default
    private LocalDateTime timestamp = java.time.LocalDateTime.now();

    private String id;
    private String name;
    private String messageString;
}
