package com.solara.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;

import com.solara.backend.entity.Field;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldDTO {
    @NotBlank(message = "Name is required")
    private String name;
    private Float latitude;
    private Float longitude;
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private BigDecimal areaHa;
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
