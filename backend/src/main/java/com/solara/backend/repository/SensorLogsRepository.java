package com.solara.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.solara.backend.entity.SensorLogs;

public interface SensorLogsRepository extends JpaRepository<SensorLogs, UUID> {
    @Query("SELECT s FROM SensorLogs s WHERE s.timestamp BETWEEN :start AND :end AND s.fieldId = :fieldId")
    List<SensorLogs> findByTimestampBetweenWithFieldId(LocalDateTime start, LocalDateTime end, UUID fieldId);

    boolean existsByFieldId(UUID fieldId);
    
    List<SensorLogs> findByFieldId(UUID fieldId);
}
