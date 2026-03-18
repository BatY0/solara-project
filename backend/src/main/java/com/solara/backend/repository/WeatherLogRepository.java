package com.solara.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.WeatherLog;

public interface WeatherLogRepository extends JpaRepository<WeatherLog, UUID> {
    void deleteByFieldId(UUID fieldId);
    void deleteByIdAndFieldId(UUID logId, UUID fieldId);
    List<WeatherLog> findAllByFieldId(UUID fieldId);
    List<WeatherLog> findByFieldIdAndLogDateBetween(UUID fieldId, LocalDate start, LocalDate end);
}