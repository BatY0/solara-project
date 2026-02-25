package com.solara.backend.dto.request;

import com.solara.backend.entity.Field;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldDTO {
    @NotBlank(message = "Name is required")
    private String name;
    private Double latitude;
    private Double longitude;
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private Double areaHa;
    @NotBlank(message = "Soil type is required")
    private String soilType;

    public FieldDTO(Field field) {
        this.name = field.getName();
        this.latitude = field.getLatitude();
        this.longitude = field.getLongitude();
        this.areaHa = field.getAreaHa();
        this.soilType = field.getSoilType();
    }

    public Field toEntity() {
        Field field = new Field();
        field.setName(this.name);
        field.setLatitude(this.latitude);
        field.setLongitude(this.longitude);
        field.setAreaHa(this.areaHa);
        field.setSoilType(this.soilType);
        return field;
    }
}
