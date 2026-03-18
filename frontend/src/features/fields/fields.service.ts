import api from '../../lib/axios';
import type {
    Field,
    FieldProperties,
    CreateFieldRequest,
    CreateFieldResponse,
    UpdateFieldPropertiesRequest,
    SensorData,
    HistoricalSensorData,
    WeatherData
} from './types';

export const fieldsService = {
    // Get all fields for the currently authenticated user
    getUserFields: async (): Promise<Field[]> => {
        const response = await api.get('/fields/user-fields');
        return response.data.data;
    },

    // Get field by ID
    getFieldById: async (id: string): Promise<Field> => {
        const response = await api.get(`/fields/${id}`);
        return response.data.data;
    },

    // Get properties for a specific field
    getFieldProperties: async (id: string): Promise<FieldProperties> => {
        const response = await api.get(`/fields/get-properties-with-field-id/${id}`);
        return response.data.data;
    },

    // Create a new field
    createField: async (data: CreateFieldRequest): Promise<CreateFieldResponse> => {
        const response = await api.post('/fields/create-field', data);
        return response.data;
    },

    // Update field properties
    updateFieldProperties: async (id: string, data: UpdateFieldPropertiesRequest): Promise<FieldProperties> => {
        const response = await api.put(`/fields/field-properties/${id}`, data);
        return response.data.data;
    },

    // Delete field
    deleteField: async (id: string): Promise<void> => {
        await api.delete(`/fields/${id}`);
    },

    // Pair hardware device to field
    pairDevice: async (fieldId: string, deviceId: string): Promise<Field> => {
        const response = await api.put(`/fields/${fieldId}/pair?deviceId=${deviceId}`);
        return response.data.data;
    },

    // Unpair hardware from field
    unpairDevice: async (fieldId: string): Promise<Field> => {
        const response = await api.delete(`/fields/${fieldId}/unpair`);
        return response.data.data;
    },

    // Get the most recent single telemetry report for a Field
    getMostRecentTelemetry: async (fieldId: string): Promise<SensorData | null> => {
        const response = await api.get(`/sensor/most-recent/${fieldId}`);
        // 204 No Content = field exists but no telemetry data yet
        // Axios returns response.data as "" (empty string) for 204
        return response.data || null;
    },

    // Get array of historical telemetry (useful for charts)
    getHistoricalTelemetry: async (fieldId: string, interval: string, start: string, end: string): Promise<HistoricalSensorData[]> => {
        const response = await api.get(`/sensor/telemetry/${fieldId}/history`, {
            params: { interval, start, end }
        });
        return response.data;
    },

    // Get live weather from WeatherAPIController (uses caching)
    getLiveWeather: async (fieldId: string): Promise<WeatherData> => {
        const response = await api.get(`/weather-api/live/${fieldId}`);
        const raw = response.data.data;
        
        if (!raw || !raw.current) {
            throw new Error("No live weather data available");
        }

        // Map OpenMeteo response to our clean WeatherData interface
        // Support both snake_case (standard API) and camelCase (Record serialization)
        return {
            fieldId: fieldId,
            temperature: raw.current.temperature_2m ?? raw.current.temperature2m ?? 0,
            humidity: raw.current.relative_humidity_2m ?? raw.current.relativeHumidity2m ?? 0,
            precipitation: raw.current.precipitation ?? 0,
            description: "", 
            iconUrl: "",
            recordedAt: raw.current.time || new Date().toISOString()
        };
    }
};
