package com.solara.backend.dto.response;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MlEngineResponseDTO {
    private List<MlCropRecommendationDTO> recommendations;
}