package com.solara.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "alert_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "field_id", nullable = false)
    private UUID fieldId;

    /** Human-readable label chosen by the user, e.g. "Low Moisture Alert" */
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    /** Which sensor metric to watch */
    @Enumerated(EnumType.STRING)
    @Column(name = "metric", nullable = false, length = 30)
    private AlertMetric metric;

    /** Comparison direction: BELOW or ABOVE the threshold */
    @Enumerated(EnumType.STRING)
    @Column(name = "operator", nullable = false, length = 10)
    private AlertOperator operator;

    /** The numeric threshold value */
    @Column(name = "threshold", nullable = false)
    private Double threshold;

    /**
     * How many consecutive minutes the condition must be true before
     * a notification is sent. E.g. 120 = "2 hours".
     */
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    /** Send an email when this rule fires */
    @Builder.Default
    @Column(name = "notify_email", nullable = false)
    private boolean notifyEmail = true;

    /** Rules can be toggled on/off without deleting them */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
