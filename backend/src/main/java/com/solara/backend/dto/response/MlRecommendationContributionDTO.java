package com.solara.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MlRecommendationContributionDTO {
    private String feature;
    private Double score;
    @JsonProperty("raw_value")
    private Double rawValue;
}
