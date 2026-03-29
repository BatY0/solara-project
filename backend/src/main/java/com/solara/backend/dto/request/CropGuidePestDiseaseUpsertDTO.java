package com.solara.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropGuidePestDiseaseUpsertDTO {
    @NotBlank
    private String languageCode;
    @NotBlank
    private String itemType; // PEST / DISEASE
    @NotBlank
    private String name;
    private String severity;
    private String prevention;
    private String organicTreatment;
    private String chemicalTreatment;
    private String notes;
}

