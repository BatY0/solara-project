package com.solara.backend.dto.request;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class AnalysisRequestDTO {

    private UUID fieldId;

    // Scenario A: past/current range
    private LocalDate startDate;
    private LocalDate endDate;

    // Scenario B/C: future season prediction
    @JsonProperty("isFuturePrediction")
    private boolean isFuturePrediction;
    private int targetMonthStart; // 1–12
    private int targetMonthEnd;   // 1–12

    // Scenario C: what-if overrides (keys: "temperature", "humidity", "rainfall")
    private Map<String, Double> overrides;

    private int topN = 5;
}
