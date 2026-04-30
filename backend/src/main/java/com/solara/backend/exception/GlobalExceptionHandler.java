package com.solara.backend.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.service.CookieService;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final CookieService cookieService;
    
    public GlobalExceptionHandler(CookieService cookieService) {
        this.cookieService = cookieService;
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        
        ApiResponse<Void> response = ApiResponse.error(
                ex.getStatus().value(),              // e.g., 404
                ex.getStatus().getReasonPhrase(),    // e.g., "Not Found"
                ex.getMessage()                      // Custom user message
        );

        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.status(ex.getStatus());

        if (ex.getStatus() == HttpStatus.UNAUTHORIZED) {
            responseBuilder
                .header(HttpHeaders.SET_COOKIE, cookieService.clearAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, cookieService.clearRefreshCookie().toString());
        }

        return responseBuilder.body(response);
    }
    
    // You can add more exception handlers here later, like:
    // @ExceptionHandler(IllegalArgumentException.class)
    // public ApiResponse<Void> handleBadRequest(IllegalArgumentException ex) { ... }
}