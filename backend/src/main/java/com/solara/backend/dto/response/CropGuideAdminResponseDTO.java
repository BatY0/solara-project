package com.solara.backend.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CropGuideAdminResponseDTO {
    private CropGuideResponseDTO core;
    private List<CropGuideTranslationDTO> translations;
    private List<CropGuidePestDiseaseDTO> pestDiseases;
    private List<CropGuidePostHarvestDTO> postHarvestProfiles;
}

