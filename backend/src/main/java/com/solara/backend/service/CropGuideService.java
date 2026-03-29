package com.solara.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.dto.response.CropGuideResponseDTO;
import com.solara.backend.repository.CropGuideRepository;
import com.solara.backend.repository.CropGuideTranslationRepository;

import com.solara.backend.entity.CropGuide;
import com.solara.backend.entity.CropGuideTranslation;
import com.solara.backend.exception.AppException;

@Service
public class CropGuideService {
    private final CropGuideRepository cropRepo;
    private final CropGuideTranslationRepository translationRepo;

    public CropGuideService(CropGuideRepository cropRepo, CropGuideTranslationRepository translationRepo) {
        this.cropRepo = cropRepo;
        this.translationRepo = translationRepo;
    }

    public Page<CropGuide> getAllPaginated(int page, int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);

        return cropRepo.findAll(pageable);
    }

    public List<CropGuide> getAll() {
        return cropRepo.findAll();
    }

    public Page<CropGuideResponseDTO> getAllPaginatedLocalized(int page, int size, String preferredLanguage) {
        Page<CropGuide> guides = getAllPaginated(page, size);
        Map<UUID, CropGuideTranslation> localizedMap = loadLocalizedTranslations(
                guides.getContent().stream().map(CropGuide::getId).toList(),
                preferredLanguage);

        return guides.map(guide -> toLocalizedDTO(guide, localizedMap.get(guide.getId())));
    }

    public List<CropGuideResponseDTO> getAllLocalized(String preferredLanguage) {
        List<CropGuide> guides = getAll();
        Map<UUID, CropGuideTranslation> localizedMap = loadLocalizedTranslations(
                guides.stream().map(CropGuide::getId).toList(),
                preferredLanguage);

        return guides.stream()
                .map(guide -> toLocalizedDTO(guide, localizedMap.get(guide.getId())))
                .toList();
    }

    public CropGuideResponseDTO getByIdLocalized(UUID id, String preferredLanguage) {
        CropGuide guide = getById(id);
        CropGuideTranslation translation = resolveTranslation(guide.getId(), preferredLanguage).orElse(null);
        return toLocalizedDTO(guide, translation);
    }

    public CropGuide getById(UUID id) {
        return cropRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Crop guide not found with id: " + id));
    }

    @Transactional
    public CropGuide createGuide(CropGuide guide) {
        return cropRepo.save(guide);
    }

    @Transactional
    public CropGuide updateGuide(UUID id, CropGuide guideDetails) {
        CropGuide existingGuide = cropRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Crop guide not found with id: " + id));

        existingGuide.setName(guideDetails.getName());
        existingGuide.setCommonNames(guideDetails.getCommonNames());
        existingGuide.setScientificName(guideDetails.getScientificName());
        existingGuide.setFamily(guideDetails.getFamily());
        existingGuide.setGrowthHabit(guideDetails.getGrowthHabit());
        existingGuide.setLifespan(guideDetails.getLifespan());
        existingGuide.setClimateHardiness(guideDetails.getClimateHardiness());
        existingGuide.setFrostTolerance(guideDetails.getFrostTolerance());
        existingGuide.setSunlightHours(guideDetails.getSunlightHours());
        existingGuide.setOptimalTemperatureMin(guideDetails.getOptimalTemperatureMin());
        existingGuide.setOptimalTemperatureMax(guideDetails.getOptimalTemperatureMax());
        existingGuide.setGerminationTempMin(guideDetails.getGerminationTempMin());
        existingGuide.setGerminationTempMax(guideDetails.getGerminationTempMax());
        existingGuide.setGrowthTempMin(guideDetails.getGrowthTempMin());
        existingGuide.setGrowthTempMax(guideDetails.getGrowthTempMax());
        existingGuide.setFruitingTempMin(guideDetails.getFruitingTempMin());
        existingGuide.setFruitingTempMax(guideDetails.getFruitingTempMax());
        existingGuide.setWaterWeeklyMm(guideDetails.getWaterWeeklyMm());
        existingGuide.setDroughtTolerance(guideDetails.getDroughtTolerance());
        existingGuide.setWaterloggingSensitivity(guideDetails.getWaterloggingSensitivity());
        existingGuide.setSoilType(guideDetails.getSoilType());
        existingGuide.setPhMin(guideDetails.getPhMin());
        existingGuide.setPhMax(guideDetails.getPhMax());
        existingGuide.setNRequirement(guideDetails.getNRequirement());
        existingGuide.setPRequirement(guideDetails.getPRequirement());
        existingGuide.setKRequirement(guideDetails.getKRequirement());
        existingGuide.setSpacingPlantCm(guideDetails.getSpacingPlantCm());
        existingGuide.setSpacingRowCm(guideDetails.getSpacingRowCm());
        existingGuide.setDepthCm(guideDetails.getDepthCm());
        existingGuide.setGerminationDays(guideDetails.getGerminationDays());
        existingGuide.setDaysToMaturity(guideDetails.getDaysToMaturity());
        existingGuide.setExpectedYield(guideDetails.getExpectedYield());
        existingGuide.setImage(guideDetails.getImage());

        return cropRepo.save(existingGuide);
    }

    @Transactional
    public void deleteGuide(UUID id) {
        CropGuide existingGuide = cropRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Crop guide not found with id: " + id));
        cropRepo.delete(existingGuide);
    }

    private Map<UUID, CropGuideTranslation> loadLocalizedTranslations(List<UUID> cropIds, String preferredLanguage) {
        if (cropIds.isEmpty()) {
            return Map.of();
        }

        List<CropGuideTranslation> preferred = translationRepo.findByCropGuideIdInAndLanguageCode(cropIds, normalizeLanguage(preferredLanguage));
        Map<UUID, CropGuideTranslation> byCrop = preferred.stream()
                .collect(Collectors.toMap(t -> t.getCropGuide().getId(), Function.identity(), (a, b) -> a));

        List<UUID> missingForEn = cropIds.stream().filter(id -> !byCrop.containsKey(id)).toList();
        if (!missingForEn.isEmpty()) {
            List<CropGuideTranslation> english = translationRepo.findByCropGuideIdInAndLanguageCode(missingForEn, "en");
            english.forEach(t -> byCrop.putIfAbsent(t.getCropGuide().getId(), t));
        }

        List<UUID> stillMissing = cropIds.stream().filter(id -> !byCrop.containsKey(id)).toList();
        if (!stillMissing.isEmpty()) {
            List<CropGuideTranslation> any = translationRepo.findByCropGuideIdIn(stillMissing);
            any.forEach(t -> byCrop.putIfAbsent(t.getCropGuide().getId(), t));
        }

        return byCrop;
    }

    private Optional<CropGuideTranslation> resolveTranslation(UUID cropId, String preferredLanguage) {
        String lang = normalizeLanguage(preferredLanguage);
        Optional<CropGuideTranslation> preferred = translationRepo.findByCropGuideIdAndLanguageCode(cropId, lang);
        if (preferred.isPresent()) return preferred;

        Optional<CropGuideTranslation> english = translationRepo.findByCropGuideIdAndLanguageCode(cropId, "en");
        if (english.isPresent()) return english;

        return translationRepo.findByCropGuideIdIn(List.of(cropId)).stream().findFirst();
    }

    private CropGuideResponseDTO toLocalizedDTO(CropGuide guide, CropGuideTranslation tr) {
        return CropGuideResponseDTO.builder()
                .id(guide.getId())
                .slug(toSlug(guide.getName()))
                .name(guide.getName())
                .commonNames(guide.getCommonNames())
                .scientificName(guide.getScientificName())
                .family(guide.getFamily())
                .growthHabit(guide.getGrowthHabit())
                .lifespan(guide.getLifespan())
                .image(guide.getImage())
                .climateHardiness(guide.getClimateHardiness())
                .frostTolerance(guide.getFrostTolerance())
                .sunlightHours(guide.getSunlightHours())
                .optimalTemperatureMin(guide.getOptimalTemperatureMin())
                .optimalTemperatureMax(guide.getOptimalTemperatureMax())
                .germinationTempMin(guide.getGerminationTempMin())
                .germinationTempMax(guide.getGerminationTempMax())
                .growthTempMin(guide.getGrowthTempMin())
                .growthTempMax(guide.getGrowthTempMax())
                .fruitingTempMin(guide.getFruitingTempMin())
                .fruitingTempMax(guide.getFruitingTempMax())
                .waterWeeklyMm(guide.getWaterWeeklyMm())
                .droughtTolerance(guide.getDroughtTolerance())
                .waterloggingSensitivity(guide.getWaterloggingSensitivity())
                .soilType(guide.getSoilType())
                .phMin(guide.getPhMin())
                .phMax(guide.getPhMax())
                .nRequirement(guide.getNRequirement())
                .pRequirement(guide.getPRequirement())
                .kRequirement(guide.getKRequirement())
                .spacingPlantCm(guide.getSpacingPlantCm())
                .spacingRowCm(guide.getSpacingRowCm())
                .depthCm(guide.getDepthCm())
                .germinationDays(guide.getGerminationDays())
                .daysToMaturity(guide.getDaysToMaturity())
                .expectedYield(guide.getExpectedYield())
                .description(tr != null ? tr.getDescription() : null)
                .commonVarieties(tr != null ? tr.getCommonVarieties() : null)
                .uses(tr != null ? tr.getUses() : null)
                .soilPreparationSteps(tr != null ? tr.getSoilPreparationSteps() : null)
                .plantingMethod(tr != null ? tr.getPlantingMethod() : null)
                .plantingTiming(tr != null ? tr.getPlantingTiming() : null)
                .irrigation(tr != null ? tr.getIrrigation() : null)
                .fertilization(tr != null ? tr.getFertilization() : null)
                .weedControl(tr != null ? tr.getWeedControl() : null)
                .supportPruning(tr != null ? tr.getSupportPruning() : null)
                .commonPests(tr != null ? tr.getCommonPests() : null)
                .commonDiseases(tr != null ? tr.getCommonDiseases() : null)
                .managementStrategies(tr != null ? tr.getManagementStrategies() : null)
                .signsOfReadiness(tr != null ? tr.getSignsOfReadiness() : null)
                .harvestingMethod(tr != null ? tr.getHarvestingMethod() : null)
                .curing(tr != null ? tr.getCuring() : null)
                .storageConditions(tr != null ? tr.getStorageConditions() : null)
                .shelfLife(tr != null ? tr.getShelfLife() : null)
                .build();
    }

    private String normalizeLanguage(String preferredLanguage) {
        if (preferredLanguage == null || preferredLanguage.isBlank()) {
            return "en";
        }
        return preferredLanguage.toLowerCase();
    }

    private String toSlug(String value) {
        if (value == null) return "";
        return value.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[_\\s]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
