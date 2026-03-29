package com.solara.backend.dto.response;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CropGuidePestDiseaseDTO {
    private UUID id;
    private String languageCode;
    private String itemType;
    private String name;
    private String severity;
    private String prevention;
    private String organicTreatment;
    private String chemicalTreatment;
    private String notes;
}

