package com.solara.backend.dto.response;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CropGuideTranslationDTO {
    private UUID id;
    private String languageCode;
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
}

