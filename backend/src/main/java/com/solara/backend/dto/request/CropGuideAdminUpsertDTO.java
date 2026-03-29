package com.solara.backend.dto.request;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropGuideAdminUpsertDTO {
    @NotBlank
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

    @NotNull
    private Integer daysToMaturity;
    private String expectedYield;

    @Builder.Default
    @Valid
    private List<CropGuideTranslationUpsertDTO> translations = new ArrayList<>();

    @Builder.Default
    @Valid
    private List<CropGuidePestDiseaseUpsertDTO> pestDiseases = new ArrayList<>();

    @Builder.Default
    @Valid
    private List<CropGuidePostHarvestUpsertDTO> postHarvestProfiles = new ArrayList<>();
}

