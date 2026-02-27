export interface Field {
    id: string;
    name: string;
    location: number[][]; // e.g. [[lat, lng], [lat, lng], ...]
    areaHa: number;
    soilType: string;
    userId: string;
    createdAt: string;

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
