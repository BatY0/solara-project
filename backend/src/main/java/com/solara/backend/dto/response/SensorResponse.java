package com.solara.backend.dto.response;

import java.util.UUID;

import com.solara.backend.entity.SensorLogs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SensorResponse {
    private UUID fieldId;
    private Double ambientTemp;
    private Double ambientHumidity;
    private Double soilTemp;
    private Double soilHumidity;
    private Double batteryVoltage;
    private Integer batteryPercentage;
    private Double locationLatitude;
    private Double locationLongitude;
    private Double locationAccuracy;
    private String errors;
    @com.fasterxml.jackson.annotation.JsonProperty("recordedAt")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private java.time.LocalDateTime recordedAt;

    public SensorResponse(SensorLogs sensorLogs) {
        this.fieldId = sensorLogs.getFieldId();
        this.recordedAt = sensorLogs.getTimestamp() != null ? sensorLogs.getTimestamp()
                : java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
        this.ambientTemp = sensorLogs.getAmbientTemp();
        this.ambientHumidity = sensorLogs.getAmbientHumidity();
        this.soilTemp = sensorLogs.getSoilTemp();
        this.soilHumidity = sensorLogs.getSoilHumidity();
        this.batteryVoltage = sensorLogs.getBatteryVoltage();
        this.batteryPercentage = sensorLogs.getBatteryPercentage();
        this.locationLatitude = sensorLogs.getLocationLatitude();
        this.locationLongitude = sensorLogs.getLocationLongitude();
        this.locationAccuracy = sensorLogs.getLocationAccuracy();
        this.errors = sensorLogs.getErrors();
    }

    public SensorLogs toEntity() {
        return SensorLogs.builder()
                .fieldId(this.fieldId)
                .ambientTemp(this.ambientTemp)
                .ambientHumidity(this.ambientHumidity)
                .soilTemp(this.soilTemp)
                .soilHumidity(this.soilHumidity)
                .batteryVoltage(this.batteryVoltage)
                .batteryPercentage(this.batteryPercentage)
                .locationLatitude(this.locationLatitude)
                .locationLongitude(this.locationLongitude)
                .locationAccuracy(this.locationAccuracy)
                .errors(this.errors)
                .build();
    }

}
