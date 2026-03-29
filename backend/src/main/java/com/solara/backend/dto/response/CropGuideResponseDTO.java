package com.solara.backend.dto.response;

import java.util.UUID;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CropGuideResponseDTO {
    private UUID id;
    private String slug;
    private String name;
    private String commonNames;
    private String scientificName;
    private String family;
    private String growthHabit;
    private String lifespan;
    private String image;

    private String climateHardiness;
    private String frostTolerance;
    private Double sunlightHours;
    private Double optimalTemperatureMin;
    private Double optimalTemperatureMax;
    private Double germinationTempMin;
    private Double germinationTempMax;
    private Double growthTempMin;
    private Double growthTempMax;
    private Double fruitingTempMin;
    private Double fruitingTempMax;
    private Double waterWeeklyMm;
    private String droughtTolerance;
    private String waterloggingSensitivity;

    private String soilType;
    private Double phMin;
    private Double phMax;
    private String nRequirement;
    private String pRequirement;
    private String kRequirement;

    private Double spacingPlantCm;
    private Double spacingRowCm;
    private Double depthCm;
    private Integer germinationDays;
    private int daysToMaturity;
    private String expectedYield;

    private String description;
    private String commonVarieties;
    private String uses;
    private String soilPreparationSteps;
    private String plantingMethod;
    private String plantingTiming;
    private String irrigation;
    private String fertilization;
    private String weedControl;
    private String supportPruning;
    private String commonPests;
    private String commonDiseases;
    private String managementStrategies;
    private String signsOfReadiness;
    private String harvestingMethod;
    private String curing;
    private String storageConditions;
    private String shelfLife;

    private List<CropGuidePestDiseaseDTO> pestDiseases;
    private List<CropGuidePostHarvestDTO> postHarvestProfiles;
}

