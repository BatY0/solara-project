package com.solara.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.AlertRule;

public interface AlertRuleRepository extends JpaRepository<AlertRule, UUID> {

    /** All active rules watching a specific field (used by evaluation engine) */
    List<AlertRule> findByFieldIdAndActiveTrue(UUID fieldId);

    /** All rules owned by a user, newest first */
    List<AlertRule> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** All rules for a specific field owned by a user */
    List<AlertRule> findByUserIdAndFieldIdOrderByCreatedAtDesc(UUID userId, UUID fieldId);

    /** Ownership-safe lookup for update/delete */
    Optional<AlertRule> findByIdAndUserId(UUID id, UUID userId);
}
