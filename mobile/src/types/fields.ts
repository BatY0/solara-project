export interface Field {
    id: string;
    name: string;
    location: number[][];
    areaHa: number;
    soilType: string;
    userId: string;
    createdAt: string;
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

export interface UpdateFieldPropertiesRequest {
    name: string;
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
}
