package com.solara.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.WeatherLog;

public interface WeatherLogRepository extends JpaRepository<WeatherLog, UUID> {
    void deleteByFieldId(UUID fieldId);
    void deleteByIdAndFieldId(UUID logId, UUID fieldId);
    List<WeatherLog> findAllByFieldId(UUID fieldId);
}