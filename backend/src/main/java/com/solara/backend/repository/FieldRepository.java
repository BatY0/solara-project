package com.solara.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.solara.backend.entity.Field;

public interface FieldRepository extends  JpaRepository<Field, UUID> {
    // Custom query method to find fields by user ID
    List<Field> findByUserId(UUID userId);
    @Query("SELECT f.name FROM Field f WHERE f.id = :fieldId")
    String findNameById(@Param("fieldId") UUID fieldId);
    // Device pairing queries
    Optional<Field> findByEspDevice_SerialNumber(String serialNumber);
    boolean existsByEspDevice_SerialNumber(String serialNumber);
    boolean existsByIdAndUserId(UUID fieldId, UUID userId);
}
