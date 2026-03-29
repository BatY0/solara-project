package com.solara.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.CropGuidePestDisease;

public interface CropGuidePestDiseaseRepository extends JpaRepository<CropGuidePestDisease, UUID> {
    List<CropGuidePestDisease> findByCropGuideId(UUID cropGuideId);

    List<CropGuidePestDisease> findByCropGuideIdAndLanguageCode(UUID cropGuideId, String languageCode);

    List<CropGuidePestDisease> findByCropGuideIdInAndLanguageCode(Collection<UUID> cropGuideIds, String languageCode);

    List<CropGuidePestDisease> findByCropGuideIdIn(Collection<UUID> cropGuideIds);

    void deleteByCropGuideId(UUID cropGuideId);
}

