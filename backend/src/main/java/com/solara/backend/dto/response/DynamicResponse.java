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
public class DynamicResponse<T> {
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    // Metadata fields
    private int status;
    private boolean success;
    private String message;
    
    // The actual payload
    private T data;

    public static <T> DynamicResponse<T> success(T data, String message) {
        return DynamicResponse.<T>builder()
                .status(200)
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> DynamicResponse<T> error(int status, String message) {
        return DynamicResponse.<T>builder()
                .status(status)
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}