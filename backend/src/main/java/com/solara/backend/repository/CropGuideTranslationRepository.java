package com.solara.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.solara.backend.entity.CropGuideTranslation;

public interface CropGuideTranslationRepository extends JpaRepository<CropGuideTranslation, UUID> {
    Optional<CropGuideTranslation> findByCropGuideIdAndLanguageCode(UUID cropGuideId, String languageCode);

    List<CropGuideTranslation> findByCropGuideIdInAndLanguageCode(Collection<UUID> cropGuideIds, String languageCode);

    List<CropGuideTranslation> findByCropGuideIdIn(Collection<UUID> cropGuideIds);
}

