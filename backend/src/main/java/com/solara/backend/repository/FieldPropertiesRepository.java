package com.solara.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.FieldProperties;

public interface FieldPropertiesRepository extends JpaRepository<FieldProperties, UUID> {
    Optional<FieldProperties> findByFieldId(UUID fieldId);
}
