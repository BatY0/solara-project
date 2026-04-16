package com.solara.backend.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.CreateAlertRuleRequest;
import com.solara.backend.dto.response.AlertEventDTO;
import com.solara.backend.dto.response.AlertRuleDTO;
import com.solara.backend.entity.AlertEvent;
import com.solara.backend.entity.AlertRule;
import com.solara.backend.entity.Field;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.AlertEventRepository;
import com.solara.backend.repository.AlertRuleRepository;
import com.solara.backend.repository.FieldRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;
    private final AlertEventRepository alertEventRepository;
    private final FieldRepository fieldRepository;

    public AlertRuleDTO createRule(UUID userId, CreateAlertRuleRequest req) {
        verifyFieldOwnership(userId, req.getFieldId());

        AlertRule rule = AlertRule.builder()
                .userId(userId)
                .fieldId(req.getFieldId())
                .name(req.getName())
                .metric(req.getMetric())
                .operator(req.getOperator())
                .threshold(req.getThreshold())
                .durationMinutes(req.getDurationMinutes())
                .notifyEmail(req.isNotifyEmail())
                .active(req.isActive())
                .build();

        rule = alertRuleRepository.save(rule);
        return mapToRuleDTO(rule);
    }

    public List<AlertRuleDTO> getRulesForUser(UUID userId) {
        return alertRuleRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToRuleDTO)
                .collect(Collectors.toList());
    }

    public List<AlertRuleDTO> getRulesForField(UUID userId, UUID fieldId) {
        verifyFieldOwnership(userId, fieldId);
        return alertRuleRepository.findByUserIdAndFieldIdOrderByCreatedAtDesc(userId, fieldId).stream()
                .map(this::mapToRuleDTO)
                .collect(Collectors.toList());
    }

    public AlertRuleDTO updateRule(UUID userId, UUID ruleId, CreateAlertRuleRequest req) {
        AlertRule rule = alertRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Alert rule not found or you don't have permission"));

        if (!rule.getFieldId().equals(req.getFieldId())) {
            verifyFieldOwnership(userId, req.getFieldId());
        }

        rule.setFieldId(req.getFieldId());
        rule.setName(req.getName());
        rule.setMetric(req.getMetric());
        rule.setOperator(req.getOperator());
        rule.setThreshold(req.getThreshold());
        rule.setDurationMinutes(req.getDurationMinutes());
        rule.setNotifyEmail(req.isNotifyEmail());
        rule.setActive(req.isActive());

        rule = alertRuleRepository.save(rule);
        return mapToRuleDTO(rule);
    }

    public void deleteRule(UUID userId, UUID ruleId) {
        AlertRule rule = alertRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Alert rule not found or you don't have permission"));

        alertRuleRepository.delete(rule);
    }

    public List<AlertEventDTO> getEventHistory(UUID userId, UUID fieldId) {
        if (fieldId != null) {
            verifyFieldOwnership(userId, fieldId);
            return alertEventRepository.findByFieldIdOrderByTriggeredAtDesc(fieldId).stream()
                    .map(this::mapToEventDTO)
                    .collect(Collectors.toList());
        } else {
            // Get all events for all fields of the user
            List<UUID> userFieldIds = getUserFieldIds(userId);
            if (userFieldIds.isEmpty()) return List.of();
            return alertEventRepository.findByFieldIdInOrderByTriggeredAtDesc(userFieldIds).stream()
                    .map(this::mapToEventDTO)
                    .collect(Collectors.toList());
        }
    }

    public List<AlertEventDTO> getUnreadNotifications(UUID userId) {
        List<UUID> userFieldIds = getUserFieldIds(userId);
        if (userFieldIds.isEmpty()) return List.of();
        
        return alertEventRepository.findByFieldIdInAndReadFalseOrderByTriggeredAtDesc(userFieldIds).stream()
                .map(this::mapToEventDTO)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(UUID userId) {
        List<UUID> userFieldIds = getUserFieldIds(userId);
        if (userFieldIds.isEmpty()) return 0;

        return alertEventRepository.countByFieldIdInAndReadFalse(userFieldIds);
    }

    public void markAsRead(UUID userId, UUID eventId) {
        List<UUID> userFieldIds = getUserFieldIds(userId);
        AlertEvent event = alertEventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Alert event not found"));
        
        if (!userFieldIds.contains(event.getFieldId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "You don't have permission for this event");
        }

        event.setRead(true);
        alertEventRepository.save(event);
    }

    public void markAllAsRead(UUID userId) {
        List<UUID> userFieldIds = getUserFieldIds(userId);
        if (userFieldIds.isEmpty()) return;

        List<AlertEvent> unreadEvents = alertEventRepository.findByFieldIdInAndReadFalseOrderByTriggeredAtDesc(userFieldIds);
        unreadEvents.forEach(e -> e.setRead(true));
        alertEventRepository.saveAll(unreadEvents);
    }

    private void verifyFieldOwnership(UUID userId, UUID fieldId) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found: " + fieldId));
        if (!field.getUserId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "You do not have access to field: " + fieldId);
        }
    }

    private List<UUID> getUserFieldIds(UUID userId) {
        return fieldRepository.findByUserId(userId).stream()
                .map(Field::getId)
                .collect(Collectors.toList());
    }

    private AlertRuleDTO mapToRuleDTO(AlertRule rule) {
        String fieldName = fieldRepository.findById(rule.getFieldId())
                .map(Field::getName)
                .orElse("Unknown Field");
        return new AlertRuleDTO(rule, fieldName);
    }

    private AlertEventDTO mapToEventDTO(AlertEvent event) {
        String fieldName = fieldRepository.findById(event.getFieldId())
                .map(Field::getName)
                .orElse("Unknown Field");
        return new AlertEventDTO(event, fieldName);
    }
}
