package com.solara.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "esp_devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EspDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "serial_number", unique = true, nullable = false, length = 50)
    private String serialNumber;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // e.g., "AVAILABLE", "IN_USE", "OFFLINE"

    @OneToOne(mappedBy = "espDevice")
    private Field field;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
