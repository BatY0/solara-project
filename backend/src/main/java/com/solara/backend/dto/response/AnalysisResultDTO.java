package com.solara.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalysisResultDTO {

    private UUID fieldId;

    /**
     * "RANGE" for Scenario A, "FUTURE" for Scenario B, "WHAT_IF" for Scenario C.
     */
    private String scenario;

    /**
     * "IOT" when sensor_logs had data, "WEATHER_LOG" when falling back to weather_logs,
     * "CLIMATOLOGY" for Scenarios B and C.
     */
    private String weatherSource;

    private LocalDateTime timestamp;

    private List<MlCropRecommendationDTO> recommendations;
}
