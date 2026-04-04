package com.solara.backend.dto.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Polygon;

import com.solara.backend.entity.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldResponseDTO {
    private UUID id;
    private String name;
    private List<double[]> location; // Simple List of Arrays to avoid JTS serialization issues
    private Double areaHa;
    private String soilType;
    private String deviceId;
    private UUID userId;
    private LocalDateTime createdAt;
    private LocalDateTime deviceLastSeenAt;

    // Constructor to convert Entity -> DTO
    public FieldResponseDTO(Field field) {
        this.id = field.getId();
        this.name = field.getName();
        this.areaHa = field.getAreaHa();
        this.userId = field.getUserId();
        this.deviceId = field.getEspDevice() != null ? field.getEspDevice().getSerialNumber() : null;
        this.deviceLastSeenAt = field.getEspDevice() != null ? field.getEspDevice().getLastSeenAt() : null;
        this.location = convertPolygonToCoordinates(field.getLocation());
        this.soilType = field.getSoilType();
        this.createdAt = field.getCreatedAt();
    }

    private List<double[]> convertPolygonToCoordinates(Polygon polygon) {
        List<double[]> coordinates = new ArrayList<>();
        if (polygon != null) {
            for (Coordinate coord : polygon.getCoordinates()) {
                coordinates.add(new double[]{coord.x, coord.y});
            }
        }
        return coordinates;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<double[]> getLocation() { return location; }
    public void setLocation(List<double[]> location) { this.location = location; }

    public Double getAreaHa() { return areaHa; }
    public void setAreaHa(Double areaHa) { this.areaHa = areaHa; }

    public String getSoilType() { return soilType; }
    public void setSoilType(String soilType) { this.soilType = soilType; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getDeviceLastSeenAt() { return deviceLastSeenAt; }
    public void setDeviceLastSeenAt(LocalDateTime deviceLastSeenAt) { this.deviceLastSeenAt = deviceLastSeenAt; }
}