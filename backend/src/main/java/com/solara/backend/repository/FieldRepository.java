package com.solara.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.Field;

public interface FieldRepository extends  JpaRepository<Field, UUID> {
    
}
