package com.solara.backend.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solara.backend.entity.EspDevice;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.repository.EspDeviceRepository;
import com.solara.backend.repository.FieldRepository;
import com.solara.backend.repository.SensorLogsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Listens on the mqttInputChannel (configured in MqttConfig).
 * Every time the ESP32 publishes to solara/telemetry/{device_id},
 * this service receives the JSON payload, resolves the field ID,
 * and saves the data to sensor_logs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetrySubscriber {

    private final FieldRepository fieldRepository;
    private final SensorLogsRepository sensorLogsRepository;
    private final EspDeviceRepository espDeviceRepository;
    private final ObjectMapper objectMapper;

    /**
     * The @ServiceActivator annotation wires this method to the mqttInputChannel bean.
     * Spring Integration calls this automatically whenever an MQTT message arrives.
     */
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleTelemetry(Message<String> message) {
        String payload = message.getPayload();
        log.info("Received MQTT telemetry payload: {}", payload);

        try {
            JsonNode json = objectMapper.readTree(payload);

            String deviceId     = json.get("device_id").asText();
            Double ambientTemp  = json.has("ambient_temperature") ? json.get("ambient_temperature").asDouble() : null;
            Double ambientHumid = json.has("ambient_humidity") ? json.get("ambient_humidity").asDouble() : null;
            Double soilHumidity = json.has("soil_humidity") ? json.get("soil_humidity").asDouble() : null;
            Double soilTemp     = json.has("soil_temperature") ? json.get("soil_temperature").asDouble() : null;

            // --- DATA VALIDATION & OUTLIER FILTERING ---
            
            // 1. Handle DS18B20 Disconnection Error (-127.0)
            if (soilTemp != null && soilTemp == -127.0) {
                log.warn("Device '{}' report soil_temperature as -127.0 (disconnected). Setting to null.", deviceId);
                soilTemp = null;
            }

            // 2. Range validation (discarding physically impossible values)
            if (ambientTemp != null && (ambientTemp < -50 || ambientTemp > 100)) ambientTemp = null;
            if (ambientHumid != null && (ambientHumid < 0 || ambientHumid > 100)) ambientHumid = null;
            if (soilTemp != null && (soilTemp < -50 || soilTemp > 100)) soilTemp = null;
            if (soilHumidity != null && (soilHumidity < 0 || soilHumidity > 100)) soilHumidity = null;

            // Look up the field that has this device paired
            Field field = fieldRepository.findByEspDevice_SerialNumber(deviceId).orElse(null);
            if (field == null) {
                log.warn("Received payload from unknown device_id='{}'. Pair the device to a field first.", deviceId);
                return;
            }

            UUID fieldId = field.getId();

            SensorLogs log_entry = SensorLogs.builder()
                    .fieldId(fieldId)
                    .deviceId(deviceId)
                    .ambientTemp(ambientTemp)
                    .ambientHumidity(ambientHumid)
                    .soilHumidity(soilHumidity)
                    .soilTemp(soilTemp)
                    .build();

            sensorLogsRepository.save(log_entry);
            
            // Update the lastSeenAt for the device
            EspDevice espDevice = field.getEspDevice();
            espDevice.setLastSeenAt(LocalDateTime.now());
            espDeviceRepository.save(espDevice);
            
            log.info("Saved telemetry from device='{}' for field='{}'", deviceId, fieldId);

        } catch (Exception e) {
            log.error("Failed to parse MQTT telemetry payload: {}", payload, e);
        }
    }
}
