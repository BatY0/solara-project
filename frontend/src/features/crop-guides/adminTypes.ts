import type { CropGuide, CropGuidePestDisease, CropGuidePostHarvestProfile } from "./types";

export interface CropGuideTranslationAdmin {
    id?: string;
    languageCode: "en" | "tr";
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

export interface CropGuideAdminRequest {
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
    daysToMaturity: number;
    expectedYield?: string;
    translations: CropGuideTranslationAdmin[];
    pestDiseases: Array<CropGuidePestDisease & { languageCode: string }>;
    postHarvestProfiles: Array<CropGuidePostHarvestProfile & { languageCode: string }>;
}

export interface CropGuideAdminResponse {
    core: CropGuide;
    translations: CropGuideTranslationAdmin[];
    pestDiseases: CropGuidePestDisease[];
    postHarvestProfiles: CropGuidePostHarvestProfile[];
}

