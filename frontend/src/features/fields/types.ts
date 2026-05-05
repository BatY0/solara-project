export interface SensorData {
    fieldId: string;
    soilTemp: number | null;
    soilHumidity: number | null;
    ambientTemp: number | null;
    ambientHumidity: number | null;
    batteryVoltage?: number | null;
    batteryPercentage?: number | null;
    recordedAt: string;
}

export interface HistoricalSensorData {
    period: string;
    avgAmbientTemp: number;
    avgSoilTemp: number;
    avgAmbientHumidity: number;
    avgSoilHumidity: number;
}

export interface WeatherData {
    fieldId: string;
    temperature: number;
    humidity: number;
    precipitation: number;
    description: string;
    iconUrl: string;
    recordedAt: string;
}

export interface Field {
    id: string;
    name: string;
    location: number[][]; // e.g. [[lat, lng], [lat, lng], ...]
    areaHa: number;
    soilType: string;
    userId: string;
    createdAt: string;
    deviceId?: string | null;
    deviceLastSeenAt?: string | null;

    // Frontend convenience property
    status?: 'online' | 'offline'; // In real app, might come from backend or computed
}

export interface FieldProperties {
    id: string;
    fieldId: string;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFieldRequest {
    name: string;
    location: number[][];
    areaHa: number;
    soilType: string;
}

export interface CreateFieldResponse {
    id: string;
    name: string;
    messageString: string;
}

export interface UpdateFieldPropertiesRequest {
    name: string;
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
}

export interface AnalysisRequest {
    fieldId: string;
    isFuturePrediction: boolean;
    startDate?: string;          // "YYYY-MM-DD" — Scenario A
    endDate?: string;            // "YYYY-MM-DD" — Scenario A
    targetMonthStart?: number;   // 1–12 — Scenario B/C
    targetMonthEnd?: number;     // 1–12 — Scenario B/C
    topN?: number;
    overrides?: {
        temperature?: number;
        humidity?: number;
        rainfall?: number;
    };
}

export interface MlCropRecommendation {
    crop: string;
    probability: number;
    contributions?: MlFeatureContribution[];
}

export interface MlFeatureContribution {
    feature: string;
    score: number;
    raw_value?: number;
}

export interface AnalysisResult {
    fieldId: string;
    scenario: 'RANGE' | 'FUTURE' | 'WHAT_IF';
    weatherSource: 'IOT' | 'WEATHER_LOG' | 'CLIMATOLOGY';
    timestamp: string;
    recommendations: MlCropRecommendation[];
}
