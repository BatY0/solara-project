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
@Table(name = "crop_guide_pest_diseases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropGuidePestDisease {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_guide_id", nullable = false)
    private CropGuide cropGuide;

    @Column(name = "language_code", nullable = false, length = 8)
    private String languageCode;

    @Column(name = "item_type", nullable = false, length = 16)
    private String itemType; // PEST or DISEASE

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "severity", length = 32)
    private String severity;

    @Column(name = "prevention", columnDefinition = "TEXT")
    private String prevention;

    @Column(name = "organic_treatment", columnDefinition = "TEXT")
    private String organicTreatment;

    @Column(name = "chemical_treatment", columnDefinition = "TEXT")
    private String chemicalTreatment;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}

