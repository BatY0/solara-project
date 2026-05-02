package com.solara.backend.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.solara.backend.dto.response.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        
        ApiResponse<Void> response = ApiResponse.error(
                ex.getStatus().value(),              // e.g., 404
                ex.getStatus().getReasonPhrase(),    // e.g., "Not Found"
                ex.getMessage()                      // Custom user message
        );

        return ResponseEntity.status(ex.getStatus())
                .body(response);
    }
    
    // You can add more exception handlers here later, like:
    // @ExceptionHandler(IllegalArgumentException.class)
    // public ApiResponse<Void> handleBadRequest(IllegalArgumentException ex) { ... }
}