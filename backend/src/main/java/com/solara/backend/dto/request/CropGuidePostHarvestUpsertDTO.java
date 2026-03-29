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
public class CropGuidePostHarvestUpsertDTO {
    @NotBlank
    private String languageCode;
    private String climateBand;
    private String curing;
    private Double storageTemperatureMin;
    private Double storageTemperatureMax;
    private Double storageHumidityMin;
    private Double storageHumidityMax;
    private Integer shelfLifeDays;
    private String storageNotes;
}

