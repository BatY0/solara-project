export interface SensorData {
    fieldId: string;
    soilTemp: number | null;
    soilHumidity: number | null;
    ambientTemp: number | null;
    ambientHumidity: number | null;
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
    location: number[][];
    areaHa: number;
    soilType: string;
    userId: string;
    createdAt: string;
    deviceId?: string | null;
    status?: 'online' | 'offline';
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

export interface UpdateFieldRequest {
    name: string;
    location: number[][];
    areaHa: number;
    soilType: string;
}

export interface UpdateFieldPropertiesRequest {
    name: string;
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
}
