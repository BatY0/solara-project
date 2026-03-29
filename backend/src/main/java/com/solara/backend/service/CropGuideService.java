package com.solara.backend.service;

import java.util.List;
import java.util.LinkedHashMap;
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

import com.solara.backend.dto.request.CropGuideAdminUpsertDTO;
import com.solara.backend.dto.request.CropGuidePestDiseaseUpsertDTO;
import com.solara.backend.dto.request.CropGuidePostHarvestUpsertDTO;
import com.solara.backend.dto.request.CropGuideTranslationUpsertDTO;
import com.solara.backend.dto.response.CropGuideAdminResponseDTO;
import com.solara.backend.dto.response.CropGuidePestDiseaseDTO;
import com.solara.backend.dto.response.CropGuidePostHarvestDTO;
import com.solara.backend.dto.response.CropGuideResponseDTO;
import com.solara.backend.dto.response.CropGuideTranslationDTO;
import com.solara.backend.repository.CropGuideRepository;
import com.solara.backend.repository.CropGuidePestDiseaseRepository;
import com.solara.backend.repository.CropGuidePostHarvestProfileRepository;
import com.solara.backend.repository.CropGuideTranslationRepository;

import com.solara.backend.entity.CropGuide;
import com.solara.backend.entity.CropGuidePestDisease;
import com.solara.backend.entity.CropGuidePostHarvestProfile;
import com.solara.backend.entity.CropGuideTranslation;
import com.solara.backend.exception.AppException;

@Service
public class CropGuideService {
    private final CropGuideRepository cropRepo;
    private final CropGuideTranslationRepository translationRepo;
    private final CropGuidePestDiseaseRepository pestDiseaseRepo;
    private final CropGuidePostHarvestProfileRepository postHarvestRepo;

    public CropGuideService(
            CropGuideRepository cropRepo,
            CropGuideTranslationRepository translationRepo,
            CropGuidePestDiseaseRepository pestDiseaseRepo,
            CropGuidePostHarvestProfileRepository postHarvestRepo) {
        this.cropRepo = cropRepo;
        this.translationRepo = translationRepo;
        this.pestDiseaseRepo = pestDiseaseRepo;
        this.postHarvestRepo = postHarvestRepo;
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

        return guides.map(guide -> toLocalizedDTO(guide, localizedMap.get(guide.getId()), preferredLanguage));
    }

    public List<CropGuideResponseDTO> getAllLocalized(String preferredLanguage) {
        List<CropGuide> guides = getAll();
        Map<UUID, CropGuideTranslation> localizedMap = loadLocalizedTranslations(
                guides.stream().map(CropGuide::getId).toList(),
                preferredLanguage);

        return guides.stream()
                .map(guide -> toLocalizedDTO(guide, localizedMap.get(guide.getId()), preferredLanguage))
                .toList();
    }

    public CropGuideResponseDTO getByIdLocalized(UUID id, String preferredLanguage) {
        CropGuide guide = getById(id);
        CropGuideTranslation translation = resolveTranslation(guide.getId(), preferredLanguage).orElse(null);
        return toLocalizedDTO(guide, translation, preferredLanguage);
    }

    public List<CropGuideAdminResponseDTO> getAdminList() {
        return cropRepo.findAll().stream()
                .map(guide -> toAdminResponseDTO(guide))
                .toList();
    }

    public CropGuideAdminResponseDTO getAdminById(UUID id) {
        return toAdminResponseDTO(getById(id));
    }

    @Transactional
    public CropGuideAdminResponseDTO createAdminGuide(CropGuideAdminUpsertDTO request) {
        validateAdminRequest(request);
        CropGuide guide = applyCoreFields(CropGuide.builder().build(), request);
        guide = cropRepo.save(guide);
        upsertNestedData(guide, request);
        return toAdminResponseDTO(guide);
    }

    @Transactional
    public CropGuideAdminResponseDTO updateAdminGuide(UUID id, CropGuideAdminUpsertDTO request) {
        validateAdminRequest(request);
        CropGuide existing = getById(id);
        existing = applyCoreFields(existing, request);
        existing = cropRepo.save(existing);
        upsertNestedData(existing, request);
        return toAdminResponseDTO(existing);
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
        translationRepo.deleteByCropGuideId(id);
        pestDiseaseRepo.deleteByCropGuideId(id);
        postHarvestRepo.deleteByCropGuideId(id);
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

    private CropGuideResponseDTO toLocalizedDTO(CropGuide guide, CropGuideTranslation tr, String preferredLanguage) {
        List<CropGuidePestDiseaseDTO> localizedPestsDiseases = resolveLocalizedPestDiseases(guide.getId(), preferredLanguage);
        List<CropGuidePostHarvestDTO> localizedPostHarvest = resolveLocalizedPostHarvestProfiles(guide.getId(), preferredLanguage);

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
                .pestDiseases(localizedPestsDiseases)
                .postHarvestProfiles(localizedPostHarvest)
                .build();
    }

    private CropGuideAdminResponseDTO toAdminResponseDTO(CropGuide guide) {
        List<CropGuideTranslationDTO> translations = translationRepo.findByCropGuideIdIn(List.of(guide.getId()))
                .stream()
                .map(tr -> CropGuideTranslationDTO.builder()
                        .id(tr.getId())
                        .languageCode(tr.getLanguageCode())
                        .description(tr.getDescription())
                        .commonVarieties(tr.getCommonVarieties())
                        .uses(tr.getUses())
                        .soilPreparationSteps(tr.getSoilPreparationSteps())
                        .plantingMethod(tr.getPlantingMethod())
                        .plantingTiming(tr.getPlantingTiming())
                        .irrigation(tr.getIrrigation())
                        .fertilization(tr.getFertilization())
                        .weedControl(tr.getWeedControl())
                        .supportPruning(tr.getSupportPruning())
                        .commonPests(tr.getCommonPests())
                        .commonDiseases(tr.getCommonDiseases())
                        .managementStrategies(tr.getManagementStrategies())
                        .signsOfReadiness(tr.getSignsOfReadiness())
                        .harvestingMethod(tr.getHarvestingMethod())
                        .curing(tr.getCuring())
                        .storageConditions(tr.getStorageConditions())
                        .shelfLife(tr.getShelfLife())
                        .build())
                .toList();

        List<CropGuidePestDiseaseDTO> pestDiseases = pestDiseaseRepo.findByCropGuideId(guide.getId())
                .stream()
                .map(this::toPestDiseaseDTO)
                .toList();

        List<CropGuidePostHarvestDTO> postHarvestProfiles = postHarvestRepo.findByCropGuideId(guide.getId())
                .stream()
                .map(this::toPostHarvestDTO)
                .toList();

        return CropGuideAdminResponseDTO.builder()
                .core(toLocalizedDTO(guide, resolveTranslation(guide.getId(), "en").orElse(null), "en"))
                .translations(translations)
                .pestDiseases(pestDiseases)
                .postHarvestProfiles(postHarvestProfiles)
                .build();
    }

    private CropGuide applyCoreFields(CropGuide target, CropGuideAdminUpsertDTO source) {
        target.setName(source.getName());
        target.setCommonNames(source.getCommonNames());
        target.setScientificName(source.getScientificName());
        target.setFamily(source.getFamily());
        target.setGrowthHabit(source.getGrowthHabit());
        target.setLifespan(source.getLifespan());
        target.setImage(source.getImage());
        target.setClimateHardiness(source.getClimateHardiness());
        target.setFrostTolerance(source.getFrostTolerance());
        target.setSunlightHours(source.getSunlightHours());
        target.setOptimalTemperatureMin(source.getOptimalTemperatureMin());
        target.setOptimalTemperatureMax(source.getOptimalTemperatureMax());
        target.setGerminationTempMin(source.getGerminationTempMin());
        target.setGerminationTempMax(source.getGerminationTempMax());
        target.setGrowthTempMin(source.getGrowthTempMin());
        target.setGrowthTempMax(source.getGrowthTempMax());
        target.setFruitingTempMin(source.getFruitingTempMin());
        target.setFruitingTempMax(source.getFruitingTempMax());
        target.setWaterWeeklyMm(source.getWaterWeeklyMm());
        target.setDroughtTolerance(source.getDroughtTolerance());
        target.setWaterloggingSensitivity(source.getWaterloggingSensitivity());
        target.setSoilType(source.getSoilType());
        target.setPhMin(source.getPhMin());
        target.setPhMax(source.getPhMax());
        target.setNRequirement(source.getNRequirement());
        target.setPRequirement(source.getPRequirement());
        target.setKRequirement(source.getKRequirement());
        target.setSpacingPlantCm(source.getSpacingPlantCm());
        target.setSpacingRowCm(source.getSpacingRowCm());
        target.setDepthCm(source.getDepthCm());
        target.setGerminationDays(source.getGerminationDays());
        target.setDaysToMaturity(source.getDaysToMaturity());
        target.setExpectedYield(source.getExpectedYield());
        return target;
    }

    private void validateAdminRequest(CropGuideAdminUpsertDTO request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Crop guide name is required.");
        }
        if (request.getDaysToMaturity() == null || request.getDaysToMaturity() <= 0) {
            throw new AppException(HttpStatus.valueOf(422), "daysToMaturity must be greater than zero.");
        }
        if (request.getTranslations() == null || request.getTranslations().isEmpty()) {
            throw new AppException(HttpStatus.valueOf(422), "At least one translation row is required.");
        }
        long uniqueLanguageCount = request.getTranslations().stream()
                .map(t -> normalizeLanguage(t.getLanguageCode()))
                .distinct()
                .count();
        if (uniqueLanguageCount != request.getTranslations().size()) {
            throw new AppException(HttpStatus.valueOf(422),
                    "Translation languages must be unique per crop guide (e.g. one 'en' and one 'tr').");
        }
    }

    private void upsertNestedData(CropGuide guide, CropGuideAdminUpsertDTO request) {
        translationRepo.deleteByCropGuideId(guide.getId());
        translationRepo.flush();
        pestDiseaseRepo.deleteByCropGuideId(guide.getId());
        postHarvestRepo.deleteByCropGuideId(guide.getId());

        if (request.getTranslations() != null && !request.getTranslations().isEmpty()) {
            Map<String, CropGuideTranslationUpsertDTO> byLanguage = new LinkedHashMap<>();
            request.getTranslations().forEach(item -> byLanguage.put(normalizeLanguage(item.getLanguageCode()), item));
            List<CropGuideTranslationUpsertDTO> uniqueTranslations = byLanguage.values().stream().toList();

            List<CropGuideTranslation> translations = uniqueTranslations.stream()
                    .map(tr -> mapTranslationUpsert(guide, tr))
                    .toList();
            translationRepo.saveAll(translations);
        }

        if (request.getPestDiseases() != null && !request.getPestDiseases().isEmpty()) {
            List<CropGuidePestDisease> pestsDiseases = request.getPestDiseases().stream()
                    .map(item -> mapPestDiseaseUpsert(guide, item))
                    .toList();
            pestDiseaseRepo.saveAll(pestsDiseases);
        }

        if (request.getPostHarvestProfiles() != null && !request.getPostHarvestProfiles().isEmpty()) {
            List<CropGuidePostHarvestProfile> postHarvestProfiles = request.getPostHarvestProfiles().stream()
                    .map(item -> mapPostHarvestUpsert(guide, item))
                    .toList();
            postHarvestRepo.saveAll(postHarvestProfiles);
        }
    }

    private CropGuideTranslation mapTranslationUpsert(CropGuide guide, CropGuideTranslationUpsertDTO source) {
        return CropGuideTranslation.builder()
                .cropGuide(guide)
                .languageCode(normalizeLanguage(source.getLanguageCode()))
                .description(source.getDescription())
                .commonVarieties(source.getCommonVarieties())
                .uses(source.getUses())
                .soilPreparationSteps(source.getSoilPreparationSteps())
                .plantingMethod(source.getPlantingMethod())
                .plantingTiming(source.getPlantingTiming())
                .irrigation(source.getIrrigation())
                .fertilization(source.getFertilization())
                .weedControl(source.getWeedControl())
                .supportPruning(source.getSupportPruning())
                .commonPests(source.getCommonPests())
                .commonDiseases(source.getCommonDiseases())
                .managementStrategies(source.getManagementStrategies())
                .signsOfReadiness(source.getSignsOfReadiness())
                .harvestingMethod(source.getHarvestingMethod())
                .curing(source.getCuring())
                .storageConditions(source.getStorageConditions())
                .shelfLife(source.getShelfLife())
                .build();
    }

    private CropGuidePestDisease mapPestDiseaseUpsert(CropGuide guide, CropGuidePestDiseaseUpsertDTO source) {
        return CropGuidePestDisease.builder()
                .cropGuide(guide)
                .languageCode(normalizeLanguage(source.getLanguageCode()))
                .itemType(source.getItemType())
                .name(source.getName())
                .severity(source.getSeverity())
                .prevention(source.getPrevention())
                .organicTreatment(source.getOrganicTreatment())
                .chemicalTreatment(source.getChemicalTreatment())
                .notes(source.getNotes())
                .build();
    }

    private CropGuidePostHarvestProfile mapPostHarvestUpsert(CropGuide guide, CropGuidePostHarvestUpsertDTO source) {
        return CropGuidePostHarvestProfile.builder()
                .cropGuide(guide)
                .languageCode(normalizeLanguage(source.getLanguageCode()))
                .climateBand(source.getClimateBand())
                .curing(source.getCuring())
                .storageTemperatureMin(source.getStorageTemperatureMin())
                .storageTemperatureMax(source.getStorageTemperatureMax())
                .storageHumidityMin(source.getStorageHumidityMin())
                .storageHumidityMax(source.getStorageHumidityMax())
                .shelfLifeDays(source.getShelfLifeDays())
                .storageNotes(source.getStorageNotes())
                .build();
    }

    private List<CropGuidePestDiseaseDTO> resolveLocalizedPestDiseases(UUID cropId, String preferredLanguage) {
        String lang = normalizeLanguage(preferredLanguage);
        List<CropGuidePestDisease> preferred = pestDiseaseRepo.findByCropGuideIdAndLanguageCode(cropId, lang);
        if (!preferred.isEmpty()) {
            return preferred.stream().map(this::toPestDiseaseDTO).toList();
        }
        List<CropGuidePestDisease> english = pestDiseaseRepo.findByCropGuideIdAndLanguageCode(cropId, "en");
        if (!english.isEmpty()) {
            return english.stream().map(this::toPestDiseaseDTO).toList();
        }
        return pestDiseaseRepo.findByCropGuideId(cropId).stream().map(this::toPestDiseaseDTO).toList();
    }

    private List<CropGuidePostHarvestDTO> resolveLocalizedPostHarvestProfiles(UUID cropId, String preferredLanguage) {
        String lang = normalizeLanguage(preferredLanguage);
        List<CropGuidePostHarvestProfile> preferred = postHarvestRepo.findByCropGuideIdAndLanguageCode(cropId, lang);
        if (!preferred.isEmpty()) {
            return preferred.stream().map(this::toPostHarvestDTO).toList();
        }
        List<CropGuidePostHarvestProfile> english = postHarvestRepo.findByCropGuideIdAndLanguageCode(cropId, "en");
        if (!english.isEmpty()) {
            return english.stream().map(this::toPostHarvestDTO).toList();
        }
        return postHarvestRepo.findByCropGuideId(cropId).stream().map(this::toPostHarvestDTO).toList();
    }

    private CropGuidePestDiseaseDTO toPestDiseaseDTO(CropGuidePestDisease item) {
        return CropGuidePestDiseaseDTO.builder()
                .id(item.getId())
                .languageCode(item.getLanguageCode())
                .itemType(item.getItemType())
                .name(item.getName())
                .severity(item.getSeverity())
                .prevention(item.getPrevention())
                .organicTreatment(item.getOrganicTreatment())
                .chemicalTreatment(item.getChemicalTreatment())
                .notes(item.getNotes())
                .build();
    }

    private CropGuidePostHarvestDTO toPostHarvestDTO(CropGuidePostHarvestProfile item) {
        return CropGuidePostHarvestDTO.builder()
                .id(item.getId())
                .languageCode(item.getLanguageCode())
                .climateBand(item.getClimateBand())
                .curing(item.getCuring())
                .storageTemperatureMin(item.getStorageTemperatureMin())
                .storageTemperatureMax(item.getStorageTemperatureMax())
                .storageHumidityMin(item.getStorageHumidityMin())
                .storageHumidityMax(item.getStorageHumidityMax())
                .shelfLifeDays(item.getShelfLifeDays())
                .storageNotes(item.getStorageNotes())
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
