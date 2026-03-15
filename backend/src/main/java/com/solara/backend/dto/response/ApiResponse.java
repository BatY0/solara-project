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
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    // Detailed error fields (will only show when set)
    private Integer status;
    private String error;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    public static <T> ApiResponse<T> success(T data, int status, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(status)
                .message(message)
                .data(data)
                .build();
    }

    // Extended Error builder
    public static <T> ApiResponse<T> error(int status, String error, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .status(status)
                .error(error)       // e.g., "Not Found" or "Bad Request"
                .message(message)   // e.g., "No sensor logs found"
                .data(null)
                .build();
    }

}
