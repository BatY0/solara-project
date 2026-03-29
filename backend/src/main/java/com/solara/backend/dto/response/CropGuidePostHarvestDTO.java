package com.solara.backend.dto.response;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CropGuidePostHarvestDTO {
    private UUID id;
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

