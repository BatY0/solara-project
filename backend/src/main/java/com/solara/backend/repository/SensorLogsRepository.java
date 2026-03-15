package com.solara.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.SensorLogs;

public interface SensorLogsRepository extends JpaRepository<SensorLogs, UUID> {
    List<SensorLogs> findByTimestampBetweenWithFieldId(LocalDateTime start, LocalDateTime end, UUID fieldId);
    boolean existsByFieldId(UUID fieldId);
    List<SensorLogs> findByFieldId(UUID fieldId);
}
