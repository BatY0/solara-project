package com.solara.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.solara.backend.entity.AlertMetric;
import com.solara.backend.entity.AlertOperator;
import com.solara.backend.entity.AlertRule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AlertRuleDTO {
    private UUID id;
    private UUID fieldId;
    private String fieldName; // Populated by service for frontend display
    private String name;
    private AlertMetric metric;
    private AlertOperator operator;
    private Double threshold;
    private Integer durationMinutes;
    private boolean notifyEmail;
    private boolean active;
    private LocalDateTime createdAt;

    public AlertRuleDTO(AlertRule rule, String fieldName) {
        this.id = rule.getId();
        this.fieldId = rule.getFieldId();
        this.fieldName = fieldName;
        this.name = rule.getName();
        this.metric = rule.getMetric();
        this.operator = rule.getOperator();
        this.threshold = rule.getThreshold();
        this.durationMinutes = rule.getDurationMinutes();
        this.notifyEmail = rule.isNotifyEmail();
        this.active = rule.isActive();
        this.createdAt = rule.getCreatedAt();
    }
}
