package com.solara.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.CropGuidePostHarvestProfile;

public interface CropGuidePostHarvestProfileRepository extends JpaRepository<CropGuidePostHarvestProfile, UUID> {
    List<CropGuidePostHarvestProfile> findByCropGuideId(UUID cropGuideId);

    List<CropGuidePostHarvestProfile> findByCropGuideIdAndLanguageCode(UUID cropGuideId, String languageCode);

    List<CropGuidePostHarvestProfile> findByCropGuideIdInAndLanguageCode(Collection<UUID> cropGuideIds, String languageCode);

    List<CropGuidePostHarvestProfile> findByCropGuideIdIn(Collection<UUID> cropGuideIds);

    void deleteByCropGuideId(UUID cropGuideId);
}

