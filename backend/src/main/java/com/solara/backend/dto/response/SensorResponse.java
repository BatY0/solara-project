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
    private Double barometricPressure;
    private Double soilTemp;
    private Double soilHumidity;

    public SensorResponse(SensorLogs sensorLogs) {
        this.fieldId = sensorLogs.getFieldId();
        this.ambientTemp = sensorLogs.getAmbientTemp();
        this.ambientHumidity = sensorLogs.getAmbientHumidity();
        this.barometricPressure = sensorLogs.getPressure();
        this.soilTemp = sensorLogs.getSoilTemp();
        this.soilHumidity = sensorLogs.getSoilHumidity();
    }

    public SensorLogs toEntity() {
        return SensorLogs.builder()
                .fieldId(this.fieldId)
                .ambientTemp(this.ambientTemp)
                .ambientHumidity(this.ambientHumidity)
                .pressure(this.barometricPressure)
                .soilTemp(this.soilTemp)
                .soilHumidity(this.soilHumidity)
                .build();
    }

}
