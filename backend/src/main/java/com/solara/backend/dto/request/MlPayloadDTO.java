package com.solara.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MlPayloadDTO {

    @JsonProperty("N")
    private double n;

    @JsonProperty("P")
    private double p;

    @JsonProperty("K")
    private double k;

    private double temperature;
    private double humidity;
    private double ph;
    private double rainfall;

    @JsonProperty("top_n")
    private int topN;
}
