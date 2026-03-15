package com.solara.backend.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.solara.backend.dto.response.ErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(ex.getStatus().value())
                .error(ex.getStatus().getReasonPhrase()) // Automatically gets "Not Found", "Bad Request", etc.
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(errorResponse, ex.getStatus());
    }
    
    // You can add more exception handlers here later, like:
    // @ExceptionHandler(IllegalArgumentException.class)
    // public ErrorResponse handleBadRequest(IllegalArgumentException ex) { ... }
}