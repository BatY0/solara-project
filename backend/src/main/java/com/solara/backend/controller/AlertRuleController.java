package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.CreateAlertRuleRequest;
import com.solara.backend.dto.response.AlertEventDTO;
import com.solara.backend.dto.response.AlertRuleDTO;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.entity.User;
import com.solara.backend.service.AlertRuleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleService alertRuleService;

    @PostMapping("/rules")
    public ResponseEntity<ApiResponse<AlertRuleDTO>> createRule(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateAlertRuleRequest request) {
        AlertRuleDTO rule = alertRuleService.createRule(currentUser.getID(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rule, HttpStatus.CREATED.value(), "Alert rule created"));
    }

    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<AlertRuleDTO>>> getRules(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) UUID fieldId) {
        List<AlertRuleDTO> rules;
        if (fieldId != null) {
            rules = alertRuleService.getRulesForField(currentUser.getID(), fieldId);
        } else {
            rules = alertRuleService.getRulesForUser(currentUser.getID());
        }
        return ResponseEntity.ok(ApiResponse.success(rules, HttpStatus.OK.value(), "Rules retrieved"));
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<AlertRuleDTO>> updateRule(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id,
            @Valid @RequestBody CreateAlertRuleRequest request) {
        AlertRuleDTO rule = alertRuleService.updateRule(currentUser.getID(), id, request);
        return ResponseEntity.ok(ApiResponse.success(rule, HttpStatus.OK.value(), "Alert rule updated"));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id) {
        alertRuleService.deleteRule(currentUser.getID(), id);
        return ResponseEntity.ok(ApiResponse.success(null, HttpStatus.OK.value(), "Alert rule deleted"));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<AlertEventDTO>>> getEvents(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) UUID fieldId) {
        List<AlertEventDTO> events = alertRuleService.getEventHistory(currentUser.getID(), fieldId);
        return ResponseEntity.ok(ApiResponse.success(events, HttpStatus.OK.value(), "Events retrieved"));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<AlertEventDTO>>> getUnreadNotifications(
            @AuthenticationPrincipal User currentUser) {
        List<AlertEventDTO> notifications = alertRuleService.getUnreadNotifications(currentUser.getID());
        return ResponseEntity.ok(ApiResponse.success(notifications, HttpStatus.OK.value(), "Unread notifications retrieved"));
    }

    @GetMapping("/notifications/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(
            @AuthenticationPrincipal User currentUser) {
        long count = alertRuleService.getUnreadCount(currentUser.getID());
        return ResponseEntity.ok(ApiResponse.success(count, HttpStatus.OK.value(), "Unread count retrieved"));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationAsRead(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id) {
        alertRuleService.markAsRead(currentUser.getID(), id);
        return ResponseEntity.ok(ApiResponse.success(null, HttpStatus.OK.value(), "Notification marked as read"));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsAsRead(
            @AuthenticationPrincipal User currentUser) {
        alertRuleService.markAllAsRead(currentUser.getID());
        return ResponseEntity.ok(ApiResponse.success(null, HttpStatus.OK.value(), "All notifications marked as read"));
    }
}
