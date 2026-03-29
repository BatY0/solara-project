package com.solara.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropGuideTranslationUpsertDTO {
    @NotBlank
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

