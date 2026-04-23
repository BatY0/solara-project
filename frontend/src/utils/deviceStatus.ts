import type { Field } from '../features/fields/types';
import { parseBackendDate } from './dateTime';

export type DeviceStatus = 'online' | 'offline' | 'inactive';

export interface DeviceStatusInfo {
    status: DeviceStatus;
    colorScheme: string;
    text: string;
    timeAgo?: string;
}

export function getDeviceStatus(field: Field, t: (key: string, options?: any) => string): DeviceStatusInfo {
    if (!field.deviceId) {
        return {
            status: 'offline',
            colorScheme: 'red',
            text: t('fields_page.offline')
        };
    }

    const baseOnlineText = t('fields_page.online');
    const baseInactiveText = t('fields_page.inactive');
    
    if (!field.deviceLastSeenAt) {
        return {
            status: 'inactive',
            colorScheme: 'yellow',
            text: t('fields_page.waiting_for_data')
        };
    }

    const lastSeenDate = parseBackendDate(field.deviceLastSeenAt);
    
    // In case the parsing results in invalid date
    if (isNaN(lastSeenDate.getTime())) {
         return {
            status: 'online',
            colorScheme: 'green',
            text: baseOnlineText
        };
    }

    const now = new Date();
    // Use Math.max to prevent negative diffs if clock skew exists
    const diffMs = Math.max(0, now.getTime() - lastSeenDate.getTime());
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgoText = '';
    if (diffMins < 1) {
        timeAgoText = t('fields_page.time_just_now');
    } else if (diffMins < 60) {
        timeAgoText = t('fields_page.time_min_ago', { value: diffMins });
    } else if (diffHours < 24) {
        timeAgoText = t('fields_page.time_hour_ago', { value: diffHours });
    } else {
        timeAgoText = t('fields_page.time_day_ago', { value: diffDays });
    }

    // Threshold of >= 24 hours (1 day) is considered inactive.
    if (diffDays >= 1) {
        return {
            status: 'inactive',
            colorScheme: 'yellow',
            text: `${baseInactiveText} - ${t('fields_page.last_seen', { value: timeAgoText })}`,
            timeAgo: timeAgoText
        };
    }

    return {
        status: 'online',
        colorScheme: 'green',
        text: `${baseOnlineText} - ${t('fields_page.last_seen', { value: timeAgoText })}`,
        timeAgo: timeAgoText
    };
}
