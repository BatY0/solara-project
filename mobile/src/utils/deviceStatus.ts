import type { Field } from '../types/fields';

export type DeviceStatus = 'online' | 'offline' | 'inactive';

export interface DeviceStatusInfo {
    status: DeviceStatus;
    label: string;
    lastSeenText?: string;
}

export function getDeviceStatus(field: Field, t: (key: string, options?: Record<string, unknown>) => string): DeviceStatusInfo {
    if (!field.deviceId) {
        return {
            status: 'offline',
            label: t('dashboard.offline'),
        };
    }

    if (!field.deviceLastSeenAt) {
        return {
            status: 'inactive',
            label: t('fields.inactive'),
            lastSeenText: t('fields.paired_waiting_data'),
        };
    }

    const parsed = new Date(field.deviceLastSeenAt);
    if (Number.isNaN(parsed.getTime())) {
        return {
            status: 'online',
            label: t('dashboard.online'),
        };
    }

    const diffMs = Math.max(0, Date.now() - parsed.getTime());
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo = t('fields.just_now');
    if (diffMinutes >= 1 && diffMinutes < 60) {
        timeAgo = t('fields.minutes_ago', { count: diffMinutes });
    } else if (diffHours >= 1 && diffHours < 24) {
        timeAgo = t('fields.hours_ago', { count: diffHours });
    } else if (diffDays >= 1) {
        timeAgo = t('fields.days_ago', { count: diffDays });
    }

    const lastSeenText = t('fields.last_seen_with_value', { timeAgo });
    const status = diffDays >= 1 ? 'inactive' : 'online';

    return {
        status,
        label: status === 'online' ? t('dashboard.online') : t('fields.inactive'),
        lastSeenText,
    };
}
