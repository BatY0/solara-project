package com.solara.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.solara.backend.entity.SensorLogs;

public interface SensorLogsRepository extends JpaRepository<SensorLogs, UUID> {
    // Fixed: the old name "findByTimestampBetweenWithFieldId" is not valid JPA naming.
    // Spring Data JPA can't parse "WithFieldId" after "Between".
    // Use @Query for complex multi-condition queries.
    @Query("SELECT s FROM SensorLogs s WHERE s.fieldId = :fieldId AND s.timestamp BETWEEN :start AND :end")
    List<SensorLogs> findByFieldIdAndTimestampBetween(
            @Param("fieldId") UUID fieldId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    boolean existsByFieldId(UUID fieldId);
    List<SensorLogs> findByFieldId(UUID fieldId);

    // Used by DeviceMonitorService to check if device sent data in the last 24 hours
    boolean existsByFieldIdAndTimestampAfter(UUID fieldId, LocalDateTime since);
}


