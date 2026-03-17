package com.solara.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OpenMeteoCurrentResponse(Current current) {
    public record Current(
        String time,
        @JsonProperty("temperature_2m") Double temperature2m,
        @JsonProperty("precipitation") Double precipitation
    ) {}
}
