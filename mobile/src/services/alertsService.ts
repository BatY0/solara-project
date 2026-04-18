import api from '../api/api';
import axios from 'axios';
import type { AlertRule, CreateAlertRuleRequest, AlertEvent } from '../types/alerts';

export const alertsService = {
    // ── RULES ─────────────────────────────────────────────────────────────────
    getRules: async (fieldId?: string): Promise<AlertRule[]> => {
        const params = fieldId ? { fieldId } : undefined;
        try {
            const response = await api.get('/alerts/rules', { params });
            return response.data.data;
        } catch (err) {
            if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
                return [];
            }
            throw err;
        }
    },

    createRule: async (request: CreateAlertRuleRequest): Promise<AlertRule> => {
        const response = await api.post('/alerts/rules', request);
        return response.data.data;
    },

    updateRule: async (id: string, request: CreateAlertRuleRequest): Promise<AlertRule> => {
        const response = await api.put(`/alerts/rules/${id}`, request);
        return response.data.data;
    },

    deleteRule: async (id: string): Promise<void> => {
        await api.delete(`/alerts/rules/${id}`);
    },

    // ── EVENTS & HISTORY ──────────────────────────────────────────────────────
    getEventHistory: async (fieldId?: string): Promise<AlertEvent[]> => {
        const params = fieldId ? { fieldId } : undefined;
        try {
            const response = await api.get('/alerts/events', { params });
            return response.data.data;
        } catch (err) {
            if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
                return [];
            }
            throw err;
        }
    },

    // ── IN-APP NOTIFICATIONS ──────────────────────────────────────────────────
    getUnreadNotifications: async (): Promise<AlertEvent[]> => {
        try {
            const response = await api.get('/alerts/notifications');
            return response.data.data;
        } catch (err) {
            if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
                return [];
            }
            throw err;
        }
    },

    getUnreadCount: async (): Promise<number> => {
        try {
            const response = await api.get('/alerts/notifications/count');
            return response.data.data;
        } catch (err) {
            if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
                return 0;
            }
            throw err;
        }
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`/alerts/notifications/${id}/read`, {});
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch('/alerts/notifications/read-all', {});
    },
};
