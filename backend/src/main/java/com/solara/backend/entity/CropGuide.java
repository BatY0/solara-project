package com.solara.backend.entity;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "crop_guides")
@Data 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropGuide {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(length = 100, nullable = false)
    private String name;

    @Column(name = "common_names", columnDefinition = "TEXT")
    private String commonNames;

    @Column(name = "scientific_name")
    private String scientificName;

    @Column(name = "plant_family")
    private String family;

    @Column(name = "growth_habit")
    private String growthHabit;

    @Column(name = "lifespan")
    private String lifespan;

    @Column(name = "min_temp")
    private Double optimalTemperatureMin;

    @Column(name = "max_temp")
    private Double optimalTemperatureMax;

    @Column(name = "days_to_maturity")
    private int daysToMaturity;

    @Column(name = "climate_hardiness")
    private String climateHardiness;

    @Column(name = "frost_tolerance")
    private String frostTolerance;

    @Column(name = "sunlight_hours")
    private Double sunlightHours;

    @Column(name = "germination_temp_min")
    private Double germinationTempMin;

    @Column(name = "germination_temp_max")
    private Double germinationTempMax;

    @Column(name = "growth_temp_min")
    private Double growthTempMin;

    @Column(name = "growth_temp_max")
    private Double growthTempMax;

    @Column(name = "fruiting_temp_min")
    private Double fruitingTempMin;

    @Column(name = "fruiting_temp_max")
    private Double fruitingTempMax;

    @Column(name = "water_weekly_mm")
    private Double waterWeeklyMm;

    @Column(name = "drought_tolerance")
    private String droughtTolerance;

    @Column(name = "waterlogging_sensitivity")
    private String waterloggingSensitivity;

    @Column(name = "soil_type")
    private String soilType;

    @Column(name = "ph_min")
    private Double phMin;

    @Column(name = "ph_max")
    private Double phMax;

    @Column(name = "n_requirement")
    private String nRequirement;

    @Column(name = "p_requirement")
    private String pRequirement;

    @Column(name = "k_requirement")
    private String kRequirement;

    @Column(name = "spacing_plant_cm")
    private Double spacingPlantCm;

    @Column(name = "spacing_row_cm")
    private Double spacingRowCm;

    @Column(name = "depth_cm")
    private Double depthCm;

    @Column(name = "germination_days")
    private Integer germinationDays;

    @Column(name = "expected_yield")
    private String expectedYield;

    @Column(name = "image_url", length = 255)
    private String image;

    @OneToMany(mappedBy = "cropGuide")
    private List<CropGuideTranslation> translations;

    @OneToMany(mappedBy = "cropGuide")
    private List<CropGuidePestDisease> pestDiseases;

    @OneToMany(mappedBy = "cropGuide")
    private List<CropGuidePostHarvestProfile> postHarvestProfiles;
}
