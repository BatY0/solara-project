package com.solara.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.solara.backend.entity.AlertEvent;

public interface AlertEventRepository extends JpaRepository<AlertEvent, UUID> {

    /**
     * Find the currently open (unresolved) event for a rule.
     * Used by the evaluation engine to detect ongoing breaches.
     */
    Optional<AlertEvent> findByRuleIdAndResolvedAtIsNull(UUID ruleId);

    /** Full history for a field, newest first */
    List<AlertEvent> findByFieldIdOrderByTriggeredAtDesc(UUID fieldId);

    /** All events for a specific rule */
    List<AlertEvent> findByRuleIdOrderByTriggeredAtDesc(UUID ruleId);

    /** Unread in-app notifications across a set of field IDs (owned by the current user) */
    List<AlertEvent> findByFieldIdInAndReadFalseOrderByTriggeredAtDesc(List<UUID> fieldIds);

    /** Count for the notification bell badge */
    long countByFieldIdInAndReadFalse(List<UUID> fieldIds);

    /** All events (read or unread) across a set of field IDs, newest first */
    @Query("SELECT e FROM AlertEvent e WHERE e.fieldId IN :fieldIds ORDER BY e.triggeredAt DESC")
    List<AlertEvent> findByFieldIdInOrderByTriggeredAtDesc(@Param("fieldIds") List<UUID> fieldIds);
}
