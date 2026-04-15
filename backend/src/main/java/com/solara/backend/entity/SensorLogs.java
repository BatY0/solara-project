package com.solara.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sensor_logs")
@Data 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorLogs {
    @Id
    @GeneratedValue(strategy=GenerationType.UUID)
    private UUID id;

    @Column(name = "field_id", nullable = false)
    private UUID fieldId;
    @Column(name = "device_id", nullable = false)
    private String deviceId;

    // Taken from sensor
    @Column(name = "soil_temperature")
    private Double soilTemp;
    @Column(name = "soil_humidity")
    private Double soilHumidity;

    @Column(name = "ambient_temperature")
    private Double ambientTemp;
    @Column(name = "ambient_humidity")
    private Double ambientHumidity;

    @Column(name = "battery_voltage")
    private Double batteryVoltage;
    @Column(name = "battery_percentage")
    private Integer batteryPercentage;

    @Column(name = "location_latitude")
    private Double locationLatitude;
    @Column(name = "location_longitude")
    private Double locationLongitude;
    @Column(name = "location_accuracy")
    private Double locationAccuracy;

    @Column(name = "errors")
    private String errors;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
