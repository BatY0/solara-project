package com.solara.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Records every breach of an AlertRule.
 *
 * Lifecycle:
 *   1. triggeredAt is set the first time the rule condition becomes true.
 *   2. notifiedAt is set when the email (and in-app flag) is sent,
 *      after durationMinutes have elapsed.
 *   3. resolvedAt is set when the metric value recovers.
 *   4. isRead tracks whether the user has seen the in-app notification.
 */
@Entity
@Table(name = "alert_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Column(name = "field_id", nullable = false)
    private UUID fieldId;

    /** Snapshot of the rule name at the time the event was created */
    @Column(name = "rule_name", nullable = false, length = 150)
    private String ruleName;

    /** Snapshot of the metric name (stored as String for readability) */
    @Column(name = "metric", nullable = false, length = 30)
    private String metric;

    /** Snapshot of the threshold value */
    @Column(name = "threshold", nullable = false)
    private Double threshold;

    /** The last sensor reading that kept the breach active */
    @Column(name = "last_value")
    private Double lastValue;

    /** When the threshold was first violated (breach start) */
    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    /** When the email/notification was actually dispatched (null = not yet sent) */
    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    /** When the value recovered above/below threshold (null = still breaching) */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    /**
     * In-app notification read flag.
     * false = unread (shows in bell badge)
     * true  = user has dismissed / read it
     */
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;
}
