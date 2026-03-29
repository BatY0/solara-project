package com.solara.backend.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "crop_guide_post_harvest_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropGuidePostHarvestProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_guide_id", nullable = false)
    private CropGuide cropGuide;

    @Column(name = "language_code", nullable = false, length = 8)
    private String languageCode;

    @Column(name = "climate_band", length = 32)
    private String climateBand;

    @Column(name = "curing", columnDefinition = "TEXT")
    private String curing;

    @Column(name = "storage_temperature_min")
    private Double storageTemperatureMin;

    @Column(name = "storage_temperature_max")
    private Double storageTemperatureMax;

    @Column(name = "storage_humidity_min")
    private Double storageHumidityMin;

    @Column(name = "storage_humidity_max")
    private Double storageHumidityMax;

    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;

    @Column(name = "storage_notes", columnDefinition = "TEXT")
    private String storageNotes;
}

