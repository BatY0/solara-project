package com.solara.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.AnalysisLog;

public interface AnalysisLogRepository extends JpaRepository<AnalysisLog, UUID> {
    Optional<AnalysisLog> findTopByFieldIdOrderByCreatedAtDesc(UUID fieldId);
}
