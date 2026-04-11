export interface CropGuidePestDisease {
    id?: string;
    languageCode?: string;
    itemType: string;
    name: string;
    severity?: string;
    prevention?: string;
    organicTreatment?: string;
    chemicalTreatment?: string;
    notes?: string;
}

export interface CropGuidePostHarvestProfile {
    id?: string;
    languageCode?: string;
    climateBand?: string;
    curing?: string;
    storageTemperatureMin?: number;
    storageTemperatureMax?: number;
    storageHumidityMin?: number;
    storageHumidityMax?: number;
    shelfLifeDays?: number;
    storageNotes?: string;
}

export interface CropGuide {
    id: string;
    slug: string;
    name: string;
    commonNames?: string;
    scientificName?: string;
    family?: string;
    growthHabit?: string;
    lifespan?: string;
    image?: string;

    // Environment
    climateHardiness?: string;
    frostTolerance?: string;
    sunlightHours?: number;
    optimalTemperatureMin?: number;
    optimalTemperatureMax?: number;
    waterWeeklyMm?: number;
    droughtTolerance?: string;
    waterloggingSensitivity?: string;

    // Soil
    soilType?: string;
    phMin?: number;
    phMax?: number;
    nRequirement?: string;
    pRequirement?: string;
    kRequirement?: string;

    // Planting
    spacingPlantCm?: number;
    spacingRowCm?: number;
    depthCm?: number;
    germinationDays?: number;
    daysToMaturity?: number;
    expectedYield?: string;

    // Rich text sections
    description?: string;
    soilPreparationSteps?: string;
    plantingMethod?: string;
    plantingTiming?: string;
    irrigation?: string;
    fertilization?: string;
    weedControl?: string;
    supportPruning?: string;
    commonPests?: string;
    commonDiseases?: string;
    managementStrategies?: string;
    signsOfReadiness?: string;
    harvestingMethod?: string;
    curing?: string;
    storageConditions?: string;
    shelfLife?: string;

    pestDiseases?: CropGuidePestDisease[];
    postHarvestProfiles?: CropGuidePostHarvestProfile[];
}
