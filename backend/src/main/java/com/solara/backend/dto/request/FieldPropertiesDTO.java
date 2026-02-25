package com.solara.backend.dto.request;

import com.solara.backend.entity.FieldProperties;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldPropertiesDTO {
    @NotBlank
    private String name;
    private Double nitrogen;
    private Double phosphorus;
    private Double potassium;
    private Double ph;

    public FieldPropertiesDTO(FieldProperties fieldProperties) {
        if (fieldProperties != null) {
            this.nitrogen = fieldProperties.getNitrogen();
            this.phosphorus = fieldProperties.getPhosphorus();
            this.potassium = fieldProperties.getPotassium();
            this.ph = fieldProperties.getPh();
        } else {
            this.nitrogen = 0.0;
            this.phosphorus = 0.0;
            this.potassium = 0.0;
            this.ph = 7.0; // Default neutral pH
        }
    }

    public FieldProperties toEntity() {
        FieldProperties fieldProperties = new FieldProperties();
        fieldProperties.setNitrogen(this.nitrogen);
        fieldProperties.setPhosphorus(this.phosphorus);
        fieldProperties.setPotassium(this.potassium);
        fieldProperties.setPh(this.ph);
        
        return fieldProperties;
    }
}
