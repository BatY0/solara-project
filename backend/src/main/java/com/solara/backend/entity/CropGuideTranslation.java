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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "crop_guide_translations",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"crop_guide_id", "language_code"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropGuideTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_guide_id", nullable = false)
    private CropGuide cropGuide;

    @Column(name = "language_code", nullable = false, length = 8)
    private String languageCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "common_varieties", columnDefinition = "TEXT")
    private String commonVarieties;

    @Column(name = "uses", columnDefinition = "TEXT")
    private String uses;

    @Column(name = "soil_preparation_steps", columnDefinition = "TEXT")
    private String soilPreparationSteps;

    @Column(name = "planting_method", columnDefinition = "TEXT")
    private String plantingMethod;

    @Column(name = "planting_timing", columnDefinition = "TEXT")
    private String plantingTiming;

    @Column(name = "irrigation", columnDefinition = "TEXT")
    private String irrigation;

    @Column(name = "fertilization", columnDefinition = "TEXT")
    private String fertilization;

    @Column(name = "weed_control", columnDefinition = "TEXT")
    private String weedControl;

    @Column(name = "support_pruning", columnDefinition = "TEXT")
    private String supportPruning;

    @Column(name = "common_pests", columnDefinition = "TEXT")
    private String commonPests;

    @Column(name = "common_diseases", columnDefinition = "TEXT")
    private String commonDiseases;

    @Column(name = "management_strategies", columnDefinition = "TEXT")
    private String managementStrategies;

    @Column(name = "signs_of_readiness", columnDefinition = "TEXT")
    private String signsOfReadiness;

    @Column(name = "harvesting_method", columnDefinition = "TEXT")
    private String harvestingMethod;

    @Column(name = "curing", columnDefinition = "TEXT")
    private String curing;

    @Column(name = "storage_conditions", columnDefinition = "TEXT")
    private String storageConditions;

    @Column(name = "shelf_life", columnDefinition = "TEXT")
    private String shelfLife;
}

