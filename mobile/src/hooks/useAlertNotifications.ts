import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { alertsService } from '../services/alertsService';
import { scheduleAlertNotification, setBadgeCount } from '../services/notificationsService';

const POLL_INTERVAL_MS = 60000;

export function useAlertNotifications(enabled: boolean): void {
    const notifiedEventIdsRef = useRef<Set<string>>(new Set());
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    const pollUnreadNotifications = useCallback(async () => {
        if (!enabled) return;

        try {
            const unreadEvents = await alertsService.getUnreadNotifications();
            const activeUnread = unreadEvents.filter(event => event.active);
            const newlySeen = activeUnread.filter(event => !notifiedEventIdsRef.current.has(event.id));

            for (const event of newlySeen) {
                await scheduleAlertNotification(event);
                notifiedEventIdsRef.current.add(event.id);
            }

            await setBadgeCount(unreadEvents.length);
        } catch (error) {
            console.error('Unread notifications polling failed:', error);
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            notifiedEventIdsRef.current.clear();
            return;
        }

        void pollUnreadNotifications();
        const interval = setInterval(() => {
            void pollUnreadNotifications();
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [enabled, pollUnreadNotifications]);

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
