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

    climateHardiness?: string;
    frostTolerance?: string;
    sunlightHours?: number;
    optimalTemperatureMin?: number;
    optimalTemperatureMax?: number;
    germinationTempMin?: number;
    germinationTempMax?: number;
    growthTempMin?: number;
    growthTempMax?: number;
    fruitingTempMin?: number;
    fruitingTempMax?: number;
    waterWeeklyMm?: number;
    droughtTolerance?: string;
    waterloggingSensitivity?: string;

    soilType?: string;
    phMin?: number;
    phMax?: number;
    nRequirement?: string;
    pRequirement?: string;
    kRequirement?: string;

    spacingPlantCm?: number;
    spacingRowCm?: number;
    depthCm?: number;
    germinationDays?: number;
    daysToMaturity?: number;
    expectedYield?: string;

    description?: string;
    commonVarieties?: string;
    uses?: string;
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
}

