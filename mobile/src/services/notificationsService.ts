import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { AlertEvent } from '../types/alerts';

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: NotificationsModule | null = null;
let notificationHandlerConfigured = false;

function isUnsupportedExpoGoAndroid(): boolean {
    return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
    if (isUnsupportedExpoGoAndroid()) {
        return null;
    }

    if (notificationsModule) return notificationsModule;
    try {
        notificationsModule = await import('expo-notifications');
        return notificationsModule;
    } catch (error) {
        console.warn('expo-notifications is unavailable in this runtime.', error);
        return null;
    }
}

async function ensureNotificationHandlerConfigured(module: NotificationsModule): Promise<void> {
    if (notificationHandlerConfigured) return;
    module.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    notificationHandlerConfigured = true;
}

/**
 * Request push-notification permissions.
 * Call this once at app startup (inside _layout.tsx).
 * Returns true if permission was granted.
 */
export async function registerForNotifications(): Promise<boolean> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return false;

    await ensureNotificationHandlerConfigured(Notifications);

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alerts', {
            name: 'Solara Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#059669',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Schedule an immediate local push notification for a single alert event.
 * The notification appears in the system tray just like a remote push.
 */
export async function scheduleAlertNotification(event: AlertEvent): Promise<void> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    await ensureNotificationHandlerConfigured(Notifications);

    const metricLabels: Record<string, string> = {
        SOIL_HUMIDITY: 'Soil Moisture',
        SOIL_TEMP: 'Soil Temp',
        AMBIENT_TEMP: 'Ambient Temp',
        AMBIENT_HUMIDITY: 'Air Humidity',
        BATTERY_PERCENTAGE: 'Battery',
    };

    const metricLabel = metricLabels[event.metric] ?? event.metric;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `⚠️ Alert: ${event.ruleName}`,
            body: `${event.fieldName} — ${metricLabel} is ${event.lastValue} (threshold: ${event.threshold})`,
            data: { eventId: event.id, fieldId: event.fieldId },
            sound: true,
        },
        trigger: null, // fire immediately
    });
}

/**
 * Update the app icon badge count (iOS / Android 13+).
 */
export async function setBadgeCount(count: number): Promise<void> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    await Notifications.setBadgeCountAsync(count);
}
