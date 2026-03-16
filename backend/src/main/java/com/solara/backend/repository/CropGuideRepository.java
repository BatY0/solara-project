package com.solara.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.CropGuide;

public interface CropGuideRepository extends JpaRepository<CropGuide, UUID> {
    
}
