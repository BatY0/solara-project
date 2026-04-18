package com.solara.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.solara.backend.entity.AlertEvent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AlertEventDTO {
    private UUID id;
    private UUID ruleId;
    private UUID fieldId;
    private String fieldName; // Populated by service
    private String ruleName;
    private String metric;
    private Double threshold;
    private Double lastValue;
    private LocalDateTime triggeredAt;
    private LocalDateTime notifiedAt;
    private LocalDateTime resolvedAt;
    private boolean read;
    private boolean active; // True if resolvedAt is null

    public AlertEventDTO(AlertEvent event, String fieldName) {
        this.id = event.getId();
        this.ruleId = event.getRuleId();
        this.fieldId = event.getFieldId();
        this.fieldName = fieldName;
        this.ruleName = event.getRuleName();
        this.metric = event.getMetric();
        this.threshold = event.getThreshold();
        this.lastValue = event.getLastValue();
        this.triggeredAt = event.getTriggeredAt();
        this.notifiedAt = event.getNotifiedAt();
        this.resolvedAt = event.getResolvedAt();
        this.read = event.isRead();
        this.active = event.getResolvedAt() == null;
    }
}
