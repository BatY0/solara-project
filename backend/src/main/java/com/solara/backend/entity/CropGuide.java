package com.solara.backend.entity;

import java.util.UUID;

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
@Table(name = "crop_guides")
@Data 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropGuide {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(length = 100)
    private String name;
    @Column(name = "scientific_name")
    private String scientificName;
    @Column(name = "min_temp")
    private Double optimalTemperatureMin;
    @Column(name = "max_temp")
    private Double optimalTemperatureMax;

    @Column(name = "days_to_maturity")
    private int daysToMaturity;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "planting_instructions", columnDefinition = "TEXT")
    private String plantingInstructions;
    
    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;
    
    @Column(name = "image_url", length = 255)
    private String image;
}
