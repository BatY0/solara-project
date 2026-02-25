package com.solara.backend.dto.request;

import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Polygon;

import com.solara.backend.entity.Field;
import com.solara.backend.utils.GeometryUtil;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
    @NotEmpty(message = "Location coordinates are required")
    private List<List<Double>> location; // List of [longitude, latitude] pairs
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private Double areaHa;
    @NotBlank(message = "Soil type is required")
    private String soilType;

    public FieldDTO(Field field) {
        this.name = field.getName();
        if (field.getLocation() != null) {
            this.location = new ArrayList<>();
            for (Coordinate coord : field.getLocation().getCoordinates()) {
                List<Double> point = new ArrayList<>();
                point.add(coord.getX()); // longitude
                point.add(coord.getY()); // latitude
                this.location.add(point);
            }
        }
        this.areaHa = field.getAreaHa();
        this.soilType = field.getSoilType();
    }

    public Field toEntity() {
        Field field = new Field();
        field.setName(this.name);
        if (this.location != null && !this.location.isEmpty()) {
            Polygon polygon = GeometryUtil.createPolygon(this.location);
            polygon.setSRID(4326);
            field.setLocation(polygon);
        }

        field.setAreaHa(this.areaHa);
        field.setSoilType(this.soilType);
        return field;
    }
}
