package com.solara.backend.dto.request;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import com.solara.backend.entity.CropGuide;
import com.solara.backend.exception.AppException;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CropDTO {
    private java.util.UUID id;

    private UUID id;

    @NotBlank(message = "Crop name is required")
    @Size(max = 100, message = "Crop name must not exceed 100 characters")
    private String name;

    private String scientificName;

    private String commonNames;
    private String family;
    private String growthHabit;
    private String lifespan;

    private String climateHardiness;
    private String frostTolerance;
    private Double sunlightHours;
    private Double optimalTemperatureMin;
    private Double optimalTemperatureMax;
    private Double germinationTempMin;
    private Double germinationTempMax;
    private Double growthTempMin;
    private Double growthTempMax;
    private Double fruitingTempMin;
    private Double fruitingTempMax;
    private Double waterWeeklyMm;
    private String droughtTolerance;
    private String waterloggingSensitivity;

    private String soilType;
    private Double phMin;
    private Double phMax;
    private String nRequirement;
    private String pRequirement;
    private String kRequirement;

    private Double spacingPlantCm;
    private Double spacingRowCm;
    private Double depthCm;
    private Integer germinationDays;

    @Min(value = 1, message = "Days to maturity must be greater than 0")
    private int daysToMaturity;

    private String expectedYield;

    @Size(max = 255, message = "Image URL must not exceed 255 characters")
    private String image;

    public CropDTO(CropGuide cropGuide) {
        this.id = cropGuide.getId();
        this.name = cropGuide.getName();
        this.commonNames = cropGuide.getCommonNames();
        this.scientificName = cropGuide.getScientificName();
        this.family = cropGuide.getFamily();
        this.growthHabit = cropGuide.getGrowthHabit();
        this.lifespan = cropGuide.getLifespan();
        this.climateHardiness = cropGuide.getClimateHardiness();
        this.frostTolerance = cropGuide.getFrostTolerance();
        this.sunlightHours = cropGuide.getSunlightHours();
        this.optimalTemperatureMin = cropGuide.getOptimalTemperatureMin();
        this.optimalTemperatureMax = cropGuide.getOptimalTemperatureMax();
        this.germinationTempMin = cropGuide.getGerminationTempMin();
        this.germinationTempMax = cropGuide.getGerminationTempMax();
        this.growthTempMin = cropGuide.getGrowthTempMin();
        this.growthTempMax = cropGuide.getGrowthTempMax();
        this.fruitingTempMin = cropGuide.getFruitingTempMin();
        this.fruitingTempMax = cropGuide.getFruitingTempMax();
        this.waterWeeklyMm = cropGuide.getWaterWeeklyMm();
        this.droughtTolerance = cropGuide.getDroughtTolerance();
        this.waterloggingSensitivity = cropGuide.getWaterloggingSensitivity();
        this.soilType = cropGuide.getSoilType();
        this.phMin = cropGuide.getPhMin();
        this.phMax = cropGuide.getPhMax();
        this.nRequirement = cropGuide.getNRequirement();
        this.pRequirement = cropGuide.getPRequirement();
        this.kRequirement = cropGuide.getKRequirement();
        this.spacingPlantCm = cropGuide.getSpacingPlantCm();
        this.spacingRowCm = cropGuide.getSpacingRowCm();
        this.depthCm = cropGuide.getDepthCm();
        this.germinationDays = cropGuide.getGerminationDays();
        this.daysToMaturity = cropGuide.getDaysToMaturity();
        this.expectedYield = cropGuide.getExpectedYield();
        this.image = cropGuide.getImage();
    }

    public CropGuide toEntity() {
        CropGuide cropGuide = new CropGuide();
        if (this.name != null && !this.name.isEmpty()) {
            cropGuide.setName(this.name);
        } else {
            throw new AppException(HttpStatus.BAD_REQUEST, "Crop name is required");
        }
        cropGuide.setCommonNames(this.commonNames);
        cropGuide.setScientificName(this.scientificName);
        cropGuide.setFamily(this.family);
        cropGuide.setGrowthHabit(this.growthHabit);
        cropGuide.setLifespan(this.lifespan);
        cropGuide.setClimateHardiness(this.climateHardiness);
        cropGuide.setFrostTolerance(this.frostTolerance);
        cropGuide.setSunlightHours(this.sunlightHours);
        if (this.optimalTemperatureMin != null && this.optimalTemperatureMax != null) {
            if (this.optimalTemperatureMin > this.optimalTemperatureMax) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Optimal minimum temperature cannot be greater than maximum temperature");
            }
        }
        cropGuide.setOptimalTemperatureMin(this.optimalTemperatureMin);
        cropGuide.setOptimalTemperatureMax(this.optimalTemperatureMax);
        cropGuide.setGerminationTempMin(this.germinationTempMin);
        cropGuide.setGerminationTempMax(this.germinationTempMax);
        cropGuide.setGrowthTempMin(this.growthTempMin);
        cropGuide.setGrowthTempMax(this.growthTempMax);
        cropGuide.setFruitingTempMin(this.fruitingTempMin);
        cropGuide.setFruitingTempMax(this.fruitingTempMax);
        cropGuide.setWaterWeeklyMm(this.waterWeeklyMm);
        cropGuide.setDroughtTolerance(this.droughtTolerance);
        cropGuide.setWaterloggingSensitivity(this.waterloggingSensitivity);
        cropGuide.setSoilType(this.soilType);
        cropGuide.setPhMin(this.phMin);
        cropGuide.setPhMax(this.phMax);
        cropGuide.setNRequirement(this.nRequirement);
        cropGuide.setPRequirement(this.pRequirement);
        cropGuide.setKRequirement(this.kRequirement);
        cropGuide.setSpacingPlantCm(this.spacingPlantCm);
        cropGuide.setSpacingRowCm(this.spacingRowCm);
        cropGuide.setDepthCm(this.depthCm);
        cropGuide.setGerminationDays(this.germinationDays);
        if (this.daysToMaturity <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Days to maturity must be greater than 0");
        }
        cropGuide.setDaysToMaturity(this.daysToMaturity);
        cropGuide.setExpectedYield(this.expectedYield);
        if (this.image != null && this.image.length() > 255) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Image URL must not exceed 255 characters");
        }
        cropGuide.setImage(this.image);
        return cropGuide;
    }
}
