import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, DeviceEventEmitter } from 'react-native';
import { alertsService } from '../services/alertsService';
import { setBadgeCount } from '../services/notificationsService';

import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { AlertEvent } from '../types/alerts';

export function useAlertNotifications(enabled: boolean): void {
    const notifiedEventIdsRef = useRef<Set<string>>(new Set());
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    
    const { user } = useAuth();
    const { stompClient, isConnected, connectionId } = useWebSocket();

    const pollUnreadNotifications = useCallback(async () => {
        if (!enabled) return;

        try {
            const unreadEvents = await alertsService.getUnreadNotifications();
            const activeUnread = unreadEvents.filter(event => event.active);
            const newlySeen = activeUnread.filter(event => !notifiedEventIdsRef.current.has(event.id));

            for (const event of newlySeen) {
                notifiedEventIdsRef.current.add(event.id);
            }

            await setBadgeCount(unreadEvents.length);
        } catch (error) {
            console.error('Unread notifications polling failed:', error);
        }
    }, [enabled]);

    // Initial fetch on mount
    useEffect(() => {
        if (!enabled) {
            notifiedEventIdsRef.current.clear();
            return;
        }

        void pollUnreadNotifications();
    }, [enabled, pollUnreadNotifications]);

    // WebSocket subscription for live updates
    useEffect(() => {
        if (!enabled || !isConnected || !stompClient || !user?.id) return;

        const subscription = stompClient.subscribe(`/topic/user.${user.id}.alerts`, (message) => {
            let bodyStr = message.body;
            if (!bodyStr && message.binaryBody) {
                try {
                    bodyStr = new TextDecoder().decode(message.binaryBody);
                } catch (e) {
                    console.error('Failed to decode binary body', e);
                }
            }
            if (bodyStr) {
                try {
                    const event = JSON.parse(bodyStr) as AlertEvent;
                    DeviceEventEmitter.emit('alerts:realtime', event);
                    if (!event.read) {
                        // Increment badge count directly if a new unread alert arrives
                        pollUnreadNotifications(); // Easiest way to fetch true count and sync badge
                    }
                } catch (err) {
                    console.error('Failed to parse alert message', err);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [enabled, isConnected, stompClient, user?.id, pollUnreadNotifications, connectionId]);

    useEffect(() => {
        if (!enabled) return;

        const subscription = AppState.addEventListener('change', nextState => {
            const previousState = appStateRef.current;
            appStateRef.current = nextState;

            if ((previousState === 'background' || previousState === 'inactive') && nextState === 'active') {
                void pollUnreadNotifications();
            }
        });

        return () => subscription.remove();
    }, [enabled, pollUnreadNotifications]);
}
