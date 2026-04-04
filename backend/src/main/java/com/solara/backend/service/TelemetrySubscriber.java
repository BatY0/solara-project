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
            double ambientTemp  = json.has("ambient_temperature") ? json.get("ambient_temperature").asDouble() : 0;
            double soilHumidity = json.has("soil_humidity") ? json.get("soil_humidity").asDouble() : 0;
            double soilTemp     = json.has("soil_temperature") ? json.get("soil_temperature").asDouble() : 0;
            double pressure     = json.has("barometric_pressure") ? json.get("barometric_pressure").asDouble() : 0;
            // TODO: Read battery_pct when battery hardware is added
            // double batteryPct = json.has("battery_pct") ? json.get("battery_pct").asDouble() : -1;

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
                    .soilHumidity(soilHumidity)
                    .soilTemp(soilTemp)
                    .pressure(pressure)
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
