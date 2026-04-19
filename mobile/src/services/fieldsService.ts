import api from '../api/api';
import type {
    Field,
    FieldProperties,
    CreateFieldRequest,
    CreateFieldResponse,
    UpdateFieldRequest,
    UpdateFieldPropertiesRequest,
    SensorData,
    HistoricalSensorData,
    WeatherData,
    AnalysisResult,
    AnalysisRequest
} from '../types/fields';

export const fieldsService = {
    getUserFields: async (): Promise<Field[]> => {
        // Backend returns 200 with an empty list when the user has no fields yet
        const response = await api.get('/fields/user-fields');
        return response.data.data ?? [];
    },

    getFieldById: async (id: string): Promise<Field> => {
        const response = await api.get(`/fields/${id}`);
        return response.data.data;
    },

    getFieldProperties: async (id: string): Promise<FieldProperties> => {
        const response = await api.get(`/fields/get-properties-with-field-id/${id}`);
        return response.data.data;
    },

    createField: async (data: CreateFieldRequest): Promise<CreateFieldResponse> => {
        const response = await api.post('/fields/create-field', data);
        return response.data;
    },

    updateField: async (
        id: string,
        data: UpdateFieldRequest,
    ): Promise<Field> => {
        const response = await api.put(`/fields/${id}`, data);
        return response.data.data;
    },

    updateFieldProperties: async (
        id: string,
        data: UpdateFieldPropertiesRequest,
    ): Promise<FieldProperties> => {
        const response = await api.put(`/fields/field-properties/${id}`, data);
        return response.data.data;
    },

    deleteField: async (id: string): Promise<void> => {
        await api.delete(`/fields/${id}`);
    },

    pairDevice: async (fieldId: string, deviceId: string): Promise<Field> => {
        const response = await api.put(`/fields/${fieldId}/pair?deviceId=${deviceId}`);
        return response.data.data;
    },

    unpairDevice: async (fieldId: string): Promise<Field> => {
        const response = await api.delete(`/fields/${fieldId}/unpair`);
        return response.data.data;
    },

    getMostRecentTelemetry: async (fieldId: string): Promise<SensorData | null> => {
        const response = await api.get(`/sensor/most-recent/${fieldId}`);
        return response.data || null;
    },

    getHistoricalTelemetry: async (fieldId: string, interval: string, start: string, end: string): Promise<HistoricalSensorData[]> => {
        const response = await api.get(`/sensor/telemetry/${fieldId}/history`, {
            params: { interval, start, end }
        });
        return response.data;
    },

    getLiveWeather: async (fieldId: string): Promise<WeatherData> => {
        const response = await api.get(`/weather-api/live/${fieldId}`);
        const body = response.data.data;
        return {
            fieldId,
            temperature: body?.current?.temperature_2m ?? 0,
            humidity: body?.current?.relative_humidity_2m ?? 0,
            precipitation: body?.current?.precipitation ?? 0,
            description: '',
            iconUrl: '',
            recordedAt: body?.current?.time ?? ''
        };
    },

    runAnalysis: async (request: AnalysisRequest): Promise<AnalysisResult> => {
        const response = await api.post('/analysis/range', request);
        return response.data.data;
    },

    getLastAnalysis: async (fieldId: string): Promise<AnalysisResult | null> => {
        // Backend returns 200 with an empty list when there is no analysis yet
        const response = await api.get(`/analysis/field/${fieldId}/last`);
        const data = response.data.data;
        if (!data || (Array.isArray(data) && data.length === 0)) return null;
        return data;
    }
};
