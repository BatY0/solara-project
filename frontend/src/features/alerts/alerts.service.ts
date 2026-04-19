import api from '../../lib/axios';
import type { AlertRule, CreateAlertRuleRequest, AlertEvent } from './types';
const API_URL = '/alerts';

export const alertsService = {
    // RULES
    getRules: async (fieldId?: string): Promise<AlertRule[]> => {
        const params = fieldId ? { fieldId } : undefined;
        const response = await api.get(`${API_URL}/rules`, { params });
        return response.data.data;
    },

    createRule: async (request: CreateAlertRuleRequest): Promise<AlertRule> => {
        const response = await api.post(`${API_URL}/rules`, request);
        return response.data.data;
    },

    updateRule: async (id: string, request: CreateAlertRuleRequest): Promise<AlertRule> => {
        const response = await api.put(`${API_URL}/rules/${id}`, request);
        return response.data.data;
    },

    deleteRule: async (id: string): Promise<void> => {
        await api.delete(`${API_URL}/rules/${id}`);
    },

    // EVENTS & HISTORY
    getEventHistory: async (fieldId?: string): Promise<AlertEvent[]> => {
        const params = fieldId ? { fieldId } : undefined;
        const response = await api.get(`${API_URL}/events`, { params });
        return response.data.data;
    },

    // IN-APP NOTIFICATIONS
    getUnreadNotifications: async (): Promise<AlertEvent[]> => {
        const response = await api.get(`${API_URL}/notifications`);
        return response.data.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await api.get(`${API_URL}/notifications/count`);
        return response.data.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`${API_URL}/notifications/${id}/read`, {});
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch(`${API_URL}/notifications/read-all`, {});
    }
};
