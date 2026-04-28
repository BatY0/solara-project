import api from '../api/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import axios from 'axios';
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

// Matches ISO-8601 timestamp strings inside CSV content (same pattern as frontend)
const CSV_ISO_TIMESTAMP_PATTERN = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?\b/g;

// Convert an ISO timestamp string to a human-readable local date-time string
function formatLocalDateTime(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

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
    },

    // Export telemetry data as CSV and open the native share sheet
    exportTelemetryCsv: async (fieldId: string, fallbackName = 'field-telemetry'): Promise<void> => {
        let response;
        try {
            // Fetch as plain text (CSV endpoint returns UTF-8 text)
            response = await api.get('/sensor/export/csv', {
                params: { fieldId },
                responseType: 'text',
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const backendMessage =
                    (error.response?.data as { message?: string } | undefined)?.message ||
                    `CSV export request failed (${error.response?.status ?? 'no-status'})`;
                throw new Error(backendMessage);
            }
            throw error;
        }

        // Extract filename from Content-Disposition header (same logic as frontend)
        const disposition = response.headers['content-disposition'] as string | undefined;
        const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
        const rawName = filenameMatch?.[1]?.trim();
        const decodedName = rawName ? decodeURIComponent(rawName.replace(/"/g, '')) : null;
        const filename = decodedName && decodedName.length > 0 ? decodedName : `${fallbackName}.csv`;

        // Prettify ISO timestamps (same as frontend)
        const csvRaw = typeof response.data === 'string'
            ? response.data
            : String(response.data ?? '');
        const csvPretty = csvRaw.replace(CSV_ISO_TIMESTAMP_PATTERN, (ts: string) => formatLocalDateTime(ts));

        // Write to a temporary cache file first
        const exportDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!exportDirectory) {
            throw new Error('No writable export directory is available on this device');
        }
        const fileUri = `${exportDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvPretty, { encoding: FileSystem.EncodingType.UTF8 });

        if (Platform.OS === 'android') {
            // On Android, use the Storage Access Framework so the file is saved
            // directly to a real folder (e.g. Downloads) the user chooses.
            // The share sheet on Android doesn't offer a "Save to device" option.
            const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (perm.granted) {
                try {
                    // Read the cached file as base64 so SAF can write it
                    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        perm.directoryUri,
                        filename,
                        'text/csv',
                    );
                    await FileSystem.writeAsStringAsync(destUri, base64Content, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    // Show a brief confirmation — SAF gives no visual feedback
                    Alert.alert('Downloaded', `${filename} saved successfully.`);
                    return;
                } catch (safErr) {
                    console.error('SAF write failed, falling back to share sheet:', safErr);
                    // Fall through to share sheet below
                }
            }
            // User cancelled the directory picker or SAF failed → share sheet fallback
        }

        // iOS (or Android fallback): use the native share sheet.
        // On iOS this correctly offers "Save to Files".
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
            throw new Error('Sharing is not available on this device');
        }
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: filename, UTI: 'public.comma-separated-values-text' });
    },
};
