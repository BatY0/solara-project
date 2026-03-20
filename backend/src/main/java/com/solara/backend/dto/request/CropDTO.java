package com.solara.backend.dto.request;

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

    @NotBlank(message = "Crop name is required")
    @Size(max = 100, message = "Crop name must not exceed 100 characters")
    private String name;

    private String scientificName;

    private Double optimalTemperatureMin;
    private Double optimalTemperatureMax;

    @Min(value = 1, message = "Days to maturity must be greater than 0")
    private int daysToMaturity;

    private String description;
    private String plantingInstructions;
    private String careInstructions;

    @Size(max = 255, message = "Image URL must not exceed 255 characters")
    private String image;

    public CropDTO(CropGuide cropGuide) {
        this.id = cropGuide.getId();
        this.name = cropGuide.getName();
        this.scientificName = cropGuide.getScientificName();
        this.optimalTemperatureMin = cropGuide.getOptimalTemperatureMin();
        this.optimalTemperatureMax = cropGuide.getOptimalTemperatureMax();
        this.daysToMaturity = cropGuide.getDaysToMaturity();
        this.description = cropGuide.getDescription();
        this.plantingInstructions = cropGuide.getPlantingInstructions();
        this.careInstructions = cropGuide.getCareInstructions();
        this.image = cropGuide.getImage();
    }

    public CropGuide toEntity() {
        CropGuide cropGuide = new CropGuide();
        if (this.name != null && !this.name.isEmpty()) {
            cropGuide.setName(this.name);
        } else {
            throw new AppException(HttpStatus.BAD_REQUEST, "Crop name is required");
        }
        cropGuide.setScientificName(this.scientificName);
        if (this.optimalTemperatureMin != null && this.optimalTemperatureMax != null) {
            if (this.optimalTemperatureMin > this.optimalTemperatureMax) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Optimal minimum temperature cannot be greater than maximum temperature");
            }
        }
        cropGuide.setOptimalTemperatureMin(this.optimalTemperatureMin);
        cropGuide.setOptimalTemperatureMax(this.optimalTemperatureMax);
        if (this.daysToMaturity <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Days to maturity must be greater than 0");
        }
        cropGuide.setDaysToMaturity(this.daysToMaturity);
        cropGuide.setDescription(this.description);
        cropGuide.setPlantingInstructions(this.plantingInstructions);
        cropGuide.setCareInstructions(this.careInstructions);
        if (this.image != null && this.image.length() > 255) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Image URL must not exceed 255 characters");
        }
        cropGuide.setImage(this.image);
        return cropGuide;
    }
}
