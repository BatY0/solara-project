import axios from 'axios';
import type { AlertRule, CreateAlertRuleRequest, AlertEvent } from './types';

const API_URL = 'http://localhost:8080/api/v1/alerts';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const alertsService = {
    // RULES
    getRules: async (fieldId?: string): Promise<AlertRule[]> => {
        const params = fieldId ? { fieldId } : undefined;
        const response = await axios.get(`${API_URL}/rules`, {
            headers: getHeaders(),
            params
        });
        return response.data.data;
    },

    createRule: async (request: CreateAlertRuleRequest): Promise<AlertRule> => {
        const response = await axios.post(`${API_URL}/rules`, request, {
            headers: getHeaders()
        });
        return response.data.data;
    },

    updateRule: async (id: string, request: CreateAlertRuleRequest): Promise<AlertRule> => {
        const response = await axios.put(`${API_URL}/rules/${id}`, request, {
            headers: getHeaders()
        });
        return response.data.data;
    },

    deleteRule: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/rules/${id}`, {
            headers: getHeaders()
        });
    },

    // EVENTS & HISTORY
    getEventHistory: async (fieldId?: string): Promise<AlertEvent[]> => {
        const params = fieldId ? { fieldId } : undefined;
        const response = await axios.get(`${API_URL}/events`, {
            headers: getHeaders(),
            params
        });
        return response.data.data;
    },

    // IN-APP NOTIFICATIONS
    getUnreadNotifications: async (): Promise<AlertEvent[]> => {
        const response = await axios.get(`${API_URL}/notifications`, {
            headers: getHeaders()
        });
        return response.data.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await axios.get(`${API_URL}/notifications/count`, {
            headers: getHeaders()
        });
        return response.data.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
            headers: getHeaders()
        });
    },

    markAllAsRead: async (): Promise<void> => {
        await axios.patch(`${API_URL}/notifications/read-all`, {}, {
            headers: getHeaders()
        });
    }
};
