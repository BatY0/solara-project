import api from '../../lib/axios';
import { parseBackendDate } from '../../utils/dateTime';
import type {
    Field,
    FieldProperties,
    CreateFieldRequest,
    CreateFieldResponse,
    UpdateFieldPropertiesRequest,
    SensorData,
    HistoricalSensorData,
    WeatherData,
    AnalysisRequest,
    AnalysisResult
} from './types';

const CSV_ISO_TIMESTAMP_PATTERN = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?\b/g;

function formatLocalDateTime(value: string): string {
    const date = parseBackendDate(value);
    if (isNaN(date.getTime())) return value;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

export interface UpdateFieldRequest {
    name: string;
    location?: number[][];
    areaHa: number;
    soilType: string;
}

export const fieldsService = {
    // Get all fields for the currently authenticated user
    getUserFields: async (): Promise<Field[]> => {
        const response = await api.get('/fields/user-fields');
        return response.data.data;
    },

    // Get all fields in the system (Admin only)
    getAllFields: async (): Promise<Field[]> => {
        const response = await api.get('/fields/all');
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

    // Update a field's core data (name, polygon, area, soil type)
    updateField: async (id: string, data: UpdateFieldRequest): Promise<Field> => {
        const response = await api.put(`/fields/${id}`, data);
        return response.data.data;
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

    // Export telemetry data as CSV and trigger browser download
    exportTelemetryCsv: async (fieldId: string, fallbackName = 'field-telemetry'): Promise<void> => {
        const response = await api.get('/sensor/export/csv', {
            params: { fieldId },
            responseType: 'blob',
        });

        const disposition = response.headers['content-disposition'] as string | undefined;
        const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
        const rawName = filenameMatch?.[1]?.trim();
        const decodedName = rawName ? decodeURIComponent(rawName.replace(/"/g, '')) : null;
        const filename = decodedName && decodedName.length > 0 ? decodedName : `${fallbackName}.csv`;

        const csvRaw = await response.data.text();
        const csvPretty = csvRaw.replace(CSV_ISO_TIMESTAMP_PATTERN, (timestamp: string) => formatLocalDateTime(timestamp));
        const blob = new Blob([csvPretty], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Run an ML crop analysis (Scenario A / B / C)
    runAnalysis: async (request: AnalysisRequest): Promise<AnalysisResult> => {
        const response = await api.post('/analysis/range', request);
        return response.data.data;
    },

    // Fetch the most recently saved analysis for a field (null if none exist)
    getLastAnalysis: async (fieldId: string): Promise<AnalysisResult | null> => {
        try {
            const response = await api.get(`/analysis/field/${fieldId}/last`);
            return response.data.data;
        } catch (err: any) {
            if (err.response?.status === 404) return null;
            throw err;
        }
    },

    // Get live weather from WeatherAPIController (uses caching)
    getLiveWeather: async (fieldId: string): Promise<WeatherData> => {
        const response = await api.get(`/weather-api/live/${fieldId}`, { timeout: 3000 });
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
