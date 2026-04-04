import api from "../../lib/axios";
import type { EspDeviceRequest, EspDeviceResponse } from "./deviceTypes";

export const adminDeviceService = {
    list: async (): Promise<EspDeviceResponse[]> => {
        const response = await api.get('/admin/devices');
        return response.data.data;
    },

    create: async (data: EspDeviceRequest): Promise<EspDeviceResponse> => {
        const response = await api.post('/admin/devices', data);
        return response.data.data;
    },

    update: async (id: string, data: EspDeviceRequest): Promise<EspDeviceResponse> => {
        const response = await api.put(`/admin/devices/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/admin/devices/${id}`);
    },

    assignToField: async (deviceId: string, fieldId: string): Promise<EspDeviceResponse> => {
        const response = await api.put(`/admin/devices/${deviceId}/assign/${fieldId}`);
        return response.data.data;
    },

    disconnectFromField: async (deviceId: string): Promise<EspDeviceResponse> => {
        const response = await api.put(`/admin/devices/${deviceId}/disconnect`);
        return response.data.data;
    }
};
