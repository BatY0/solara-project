package com.solara.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MlCropRecommendationDTO {
    private String crop;
    private Double probability;
}
