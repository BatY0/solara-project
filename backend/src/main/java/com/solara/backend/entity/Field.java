package com.solara.backend.entity;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Polygon;

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
@Table(name = "fields")
@Data 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Field {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Assuming a simple UUID for the foreign key. 
    // You can later change this to @ManyToOne if you create a User entity.
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(length = 100)
    private String name;

    
    @Column(name = "location", columnDefinition="geometry(Polygon, 4326)")
    private Polygon location;

    @Column(name = "area_ha")
    private Double areaHa;
    
    @Column(name = "soil_type", length = 50)
    private String soilType;

    /**
     * The paired hardware device's serial number (e.g. "ESP32-A1B2C3D4E5F6").
     * Nullable: a field may exist without a device paired to it.
     * One device can only be linked to one field (enforced in FieldService).
     */
    @Column(name = "device_id", unique = true, length = 50)
    private String deviceId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;


    public Polygon getLocation() {
        return location;
    }
}
